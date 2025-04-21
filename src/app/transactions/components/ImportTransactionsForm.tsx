"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  importTransactions,
  fetchBankAccounts,
  fetchCreditCards,
} from "@/utils/api";
import { BankAccount, CreditCard, Transaction, Category } from "@/utils/types";
import ImportSummary from "@/app/transactions/components/ImportSummary";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Create simple Alert components
interface AlertProps {
  className?: string;
  variant?: "default" | "destructive";
  children: React.ReactNode;
}

const Alert = ({ 
  className, 
  variant = "default", 
  children 
}: AlertProps) => {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        variant === "destructive" 
          ? "border-red-500 bg-red-50 text-red-700" 
          : "border-gray-200 bg-gray-50 text-gray-700",
        className
      )}
    >
      {children}
    </div>
  );
};

const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <h5 className="mb-1 font-medium leading-none tracking-tight">{children}</h5>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm">{children}</div>
);

type ImportResponse = {
  importedCount: number;
  duplicatesCount: number;
  errors: string[];
};

type ColumnMapping = {
  description: string;
  amount: string;
  executionDate: string;
  type: string;
  categoryName: string;
  tagNames: string;
};

interface ImportTransactionsFormProps {
  onImportComplete: (transactions: Transaction[]) => void;
  categories: Category[];
}

const DATE_FORMATS = [
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY (e.g., 12/31/2023)" },
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY (e.g., 31/12/2023)" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD (e.g., 2023-12-31)" },
  { value: "yyyy/MM/dd", label: "YYYY/MM/DD (e.g., 2023/12/31)" },
  { value: "MM-dd-yyyy", label: "MM-DD-YYYY (e.g., 12-31-2023)" },
  { value: "dd-MM-yyyy", label: "DD-MM-YYYY (e.g., 31-12-2023)" },
  { value: "MMM dd, yyyy", label: "MMM DD, YYYY (e.g., Dec 31, 2023)" },
];

export default function ImportTransactionsForm({
  onImportComplete,
  categories
}: ImportTransactionsFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({
    description: "none",
    amount: "none",
    executionDate: "none",
    type: "none",
    categoryName: "none",
    tagNames: "none",
  });
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0].value);
  const [bankFormat, setBankFormat] = useState<
    "standard" | "webank" | "fineco" | "bnl_txt" | "bnl_xls"
  >("standard");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectionType, setSelectionType] = useState<"bank" | "card" | null>(
    null
  );
  const [selectedBankAccount, setSelectedBankAccount] = useState<number | null>(
    null
  );
  const [selectedCreditCard, setSelectedCreditCard] = useState<number | null>(
    null
  );

  const [showSummary, setShowSummary] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    async function loadAccountData() {
      try {
        const [bankAccountsData, creditCardsData] = await Promise.all([
          fetchBankAccounts(token),
          fetchCreditCards(token),
        ]);
        setBankAccounts(bankAccountsData);
        setCreditCards(creditCardsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load accounts and cards");
      }
    }

    loadAccountData();
  }, [token]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);

      if (bankFormat === "standard") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const headers = text.split("\n")[0].split(",")
            .map((h) => h.trim())
            .map((h, i) => h || `Column ${i+1}`)
            .filter(Boolean);
          setCsvHeaders(headers);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
  
    setIsLoading(true);
    setError(null);
    setImportResult(null);
  
    try {
      const reader = new FileReader();
  
      reader.onload = async (event) => {
        let fileContent = '';
      
        if (csvFile.name.endsWith('.txt')) {
          // TXT viene letto come testo
          fileContent = event.target?.result as string;
        } else {
          // Altri formati vengono letti come binary e poi convertiti in base64
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          fileContent = btoa(binary); // base64 string
        }
      
        const payload: any = {
          csvData: fileContent,
          bankAccountId: selectionType === "bank" ? selectedBankAccount : undefined,
          creditCardId: selectionType === "card" ? selectedCreditCard : undefined,
        };
      
        if (bankFormat !== "standard") {
          payload.bankFormat = bankFormat;
        } else {
          // Process columnMappings to remove 'none' values
          const processedMappings: Record<string, string> = {};
          Object.keys(columnMappings).forEach((key) => {
            const value = columnMappings[key as keyof ColumnMapping];
            processedMappings[key] = value === "none" ? "" : value;
          });
          
          payload.columnMappings = processedMappings;
          payload.dateFormat = dateFormat;
        }
      
        const response = await importTransactions(token, payload);      
  
        console.log("Import API response:", response);
        
        if (Array.isArray(response)) {
          setImportedCount(response.length);
          setImportResult({
            importedCount: response.length,
            duplicatesCount: 0,
            errors: [],
          });
          console.log("Passing transactions to parent:", response);
          onImportComplete(response);
        } else {
          setImportResult({
            importedCount: response.importedCount || 0,
            duplicatesCount: response.duplicatesCount || 0,
            errors: response.errors || [],
          });
          
          setImportedCount(response.importedCount || 0);
          
          if (response.transactions && Array.isArray(response.transactions)) {
            console.log("Passing transactions to parent:", response.transactions);
            onImportComplete(response.transactions);
          } else {
            console.warn("No transactions array in response:", response);
            onImportComplete([]);
          }
        }
        
        setShowSummary(true);
        setCsvFile(null);
        setCsvHeaders([]);
        setColumnMappings({
          description: "none",
          amount: "none",
          executionDate: "none",
          type: "none",
          categoryName: "none",
          tagNames: "none",
        });
      };
  
      if (csvFile.name.endsWith('.txt')) {
        reader.readAsText(csvFile, 'utf-8');
      } else {
        reader.readAsArrayBuffer(csvFile);
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import transactions");
      onImportComplete([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        {importResult && (
          <Alert className={importResult.errors.length > 0 ? "mb-6 border-yellow-500 bg-yellow-50" : "mb-6 border-green-500 bg-green-50"}>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Import Results</AlertTitle>
            <AlertDescription>
              <div className="text-sm mt-2">
                <p className="text-green-700">Successfully imported: {importResult.importedCount} transactions</p>
                
                {importResult.duplicatesCount > 0 && (
                  <p className="text-yellow-700 mt-1">
                    Potential duplicates found: {importResult.duplicatesCount}
                  </p>
                )}
                
                {importResult.errors.length > 0 && (
                  <div className="mt-1 text-red-700">
                    <p>Errors: {importResult.errors.length}</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      {importResult.errors.map((err, index) => (
                        <li key={index} className="text-xs">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form id="import-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File (.csv / .xls / .xlsx / .txt)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xls,.xlsx,.txt"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                {csvFile && (
                  <p className="text-sm text-muted-foreground">
                    {csvFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-format">Bank Format (auto-detect)</Label>
              <Select value={bankFormat || "standard"} onValueChange={(value) => setBankFormat(value as typeof bankFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Standard CSV (manual mapping) --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">-- Standard CSV (manual mapping) --</SelectItem>
                  <SelectItem value="webank">Webank (.xls HTML Table)</SelectItem>
                  <SelectItem value="fineco">Fineco (.xlsx)</SelectItem>
                  <SelectItem value="bnl_txt">BNL (TXT)</SelectItem>
                  <SelectItem value="bnl_xls">BNL (XLS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bankFormat === "standard" && csvFile && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="block text-base font-medium">Map CSV Columns</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(columnMappings).map((field) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`column-${field}`} className="capitalize">{field}</Label>
                        <Select 
                          value={columnMappings[field as keyof ColumnMapping]} 
                          onValueChange={(value) => handleMappingChange(field as keyof ColumnMapping, value)}
                        >
                          <SelectTrigger id={`column-${field}`}>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {csvHeaders
                              .filter(header => header && header.trim() !== '')
                              .map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4 pt-2">
              <Label className="block text-base font-medium">Associate with Account</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="noAccount"
                    name="accountType"
                    className="h-4 w-4"
                    checked={selectionType === null}
                    onChange={() => {
                      setSelectionType(null);
                      setSelectedBankAccount(null);
                      setSelectedCreditCard(null);
                    }}
                  />
                  <Label htmlFor="noAccount" className="font-normal">No Account</Label>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="bankAccount"
                      name="accountType"
                      className="h-4 w-4"
                      checked={selectionType === "bank"}
                      onChange={() => {
                        setSelectionType("bank");
                        setSelectedCreditCard(null);
                      }}
                    />
                    <Label htmlFor="bankAccount" className="font-normal">Bank Account</Label>
                  </div>
                  
                  {selectionType === "bank" && (
                    <div className="ml-6">
                      <Select 
                        value={selectedBankAccount?.toString() || 'none'} 
                        onValueChange={(value) => setSelectedBankAccount(value === 'none' ? null : parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {bankAccounts.map((account) => (
                            <SelectItem 
                              key={account.id || `account-${account.name}`} 
                              value={account.id ? account.id.toString() : `account-${account.name}`}
                            >
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="creditCard"
                      name="accountType"
                      className="h-4 w-4"
                      checked={selectionType === "card"}
                      onChange={() => {
                        setSelectionType("card");
                        setSelectedBankAccount(null);
                      }}
                    />
                    <Label htmlFor="creditCard" className="font-normal">Credit Card</Label>
                  </div>
                  
                  {selectionType === "card" && (
                    <div className="ml-6">
                      <Select 
                        value={selectedCreditCard?.toString() || 'none'} 
                        onValueChange={(value) => setSelectedCreditCard(value === 'none' ? null : parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select credit card" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {creditCards.map((card) => (
                            <SelectItem 
                              key={card.id || `card-${card.name}`} 
                              value={card.id ? card.id.toString() : `card-${card.name}`}
                            >
                              {card.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          type="submit"
          form="import-form"
          disabled={isLoading || !csvFile}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Transactions
            </>
          )}
        </Button>
      </CardFooter>

      {showSummary && (
        <ImportSummary 
          importedCount={importedCount}
          categories={categories}
          onClose={() => setShowSummary(false)}
        />
      )}
    </>
  );
}