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
  categories,
}: ImportTransactionsFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({
    description: "",
    amount: "",
    executionDate: "",
    type: "",
    categoryName: "",
    tagNames: "",
  });
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0].value);
  const [bankFormat, setBankFormat] = useState<
    "" | "webank" | "fineco" | "bnl_txt" | "bnl_xls"
  >("");
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

      if (!bankFormat) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const headers = text.split("\n")[0].split(",").map((h) => h.trim());
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
      
        if (bankFormat) {
          payload.bankFormat = bankFormat;
        } else {
          payload.columnMappings = columnMappings;
          payload.dateFormat = dateFormat;
        }
      
        const result = await importTransactions(token, payload);      
  
        setImportResult(result);
        setImportedCount(result.importedCount);
        setShowSummary(true);
        onImportComplete(result.transactions);
        setCsvFile(null);
        setCsvHeaders([]);
        setColumnMappings({
          description: "",
          amount: "",
          executionDate: "",
          type: "",
          categoryName: "",
          tagNames: "",
        });
      };
  
      if (csvFile.name.endsWith('.txt')) {
        reader.readAsText(csvFile, 'utf-8');
      } else {
        reader.readAsArrayBuffer(csvFile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions");
    } finally {
      setIsLoading(false);
    }
  };
  
  

  return (
    <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-4 mb-4">
      <h2 className="text-lg font-semibold mb-4">Import Transactions</h2>

      {importResult && (
        <div className="mb-4 p-4 bg-green-50 rounded">
          <h3 className="font-medium text-green-800">Import Results:</h3>
          <ul className="mt-2 text-sm">
            <li>Successfully imported: {importResult.importedCount} transactions</li>
            {importResult.duplicatesCount > 0 && (
              <li className="text-yellow-700">
                Potential duplicates found: {importResult.duplicatesCount}
              </li>
            )}
            {importResult.errors && importResult.errors.length > 0 && (
              <li className="text-red-700">
                Errors: {importResult.errors.length}
                <ul className="ml-4">
                  {importResult.errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Upload File (.csv / .xls / .xlsx / .txt)
            <input
              type="file"
              accept=".csv,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              className="mt-1 block w-full"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Bank Format (auto-detect)
            <select
              value={bankFormat}
              onChange={(e) => setBankFormat(e.target.value as typeof bankFormat)}
              className="w-full p-2 border rounded mt-1"
            >
              <option value="">-- Standard CSV (manual mapping) --</option>
              <option value="webank">Webank (.xls HTML Table)</option>
              <option value="fineco">Fineco (.xlsx)</option>
              <option value="bnl_txt">BNL (TXT)</option>
              <option value="bnl_xls">BNL (XLS)</option>
            </select>
          </label>
        </div>

        {!bankFormat && csvFile && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {DATE_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Map CSV Columns</h3>
              {Object.keys(columnMappings).map((field) => (
                <div key={field}>
                  <label className="block text-gray-700 mb-1 capitalize">{field}</label>
                  <select
                    value={columnMappings[field as keyof ColumnMapping]}
                    onChange={(e) =>
                      handleMappingChange(field as keyof ColumnMapping, e.target.value)
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select column</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mb-4">
          <h3 className="font-medium mb-2">Associate with Account</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="noAccount"
                name="accountType"
                checked={selectionType === null}
                onChange={() => {
                  setSelectionType(null);
                  setSelectedBankAccount(null);
                  setSelectedCreditCard(null);
                }}
              />
              <label htmlFor="noAccount">No Account</label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="bankAccount"
                name="accountType"
                checked={selectionType === "bank"}
                onChange={() => {
                  setSelectionType("bank");
                  setSelectedCreditCard(null);
                }}
              />
              <label htmlFor="bankAccount" className="mr-2">
                Bank Account
              </label>
              {selectionType === "bank" && (
                <select
                  value={selectedBankAccount || ""}
                  onChange={(e) => setSelectedBankAccount(Number(e.target.value))}
                  className="p-2 border rounded flex-grow"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="creditCard"
                name="accountType"
                checked={selectionType === "card"}
                onChange={() => {
                  setSelectionType("card");
                  setSelectedBankAccount(null);
                }}
              />
              <label htmlFor="creditCard" className="mr-2">
                Credit Card
              </label>
              {selectionType === "card" && (
                <select
                  value={selectedCreditCard || ""}
                  onChange={(e) => setSelectedCreditCard(Number(e.target.value))}
                  className="p-2 border rounded flex-grow"
                >
                  <option value="">Select Credit Card</option>
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !csvFile}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? "Importing..." : "Import Transactions"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>

      {showSummary && (
        <ImportSummary 
          importedCount={importedCount}
          categories={categories}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
