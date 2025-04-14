import React, { useEffect, useState } from 'react';
import { fetchCurrentBalance } from '@/utils/api'; // Adjust the import based on your API utility
import { useSession } from "next-auth/react";

const CurrentBalance = () => {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentBalance = async () => {
      try {
        const response = await fetchCurrentBalance(token); // Call the API to get the current balance
        setCurrentBalance(response.currentBalance);
      } catch (err) {
        setError("Failed to fetch current balance");
      } finally {
        setLoading(false);
      }
    };

    getCurrentBalance();
  }, []);

  if (loading) return <div>Loading current balance...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-blue-100 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Current Balance</h3>
      <p className="text-xl font-bold">{`$${currentBalance?.toFixed(2)}`}</p>
    </div>
  );
};

export default CurrentBalance; 