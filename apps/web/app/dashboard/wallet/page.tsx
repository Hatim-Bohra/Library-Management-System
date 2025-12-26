"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, DollarSign, Wallet as WalletIcon, ArrowUp, ArrowDown } from "lucide-react";

interface Transaction {
    id: string;
    amount: string;
    type: "DEPOSIT" | "RENTAL" | "FINE_PAYMENT";
    status: string;
    createdAt: string;
}

export default function WalletPage() {
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositing, setDepositing] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

    const fetchWalletData = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            const [balanceRes, transactionsRes] = await Promise.all([
                fetch(`${API_URL}/wallet/balance`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_URL}/wallet/transactions`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (balanceRes.ok) {
                const data = await balanceRes.json();
                setBalance(data.balance);
            }
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error("Failed to fetch wallet data", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (!amount || amount <= 0) {
            toast.error("Invalid Amount", { description: "Please enter a positive amount." });
            return;
        }

        setDepositing(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/wallet/deposit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount }),
            });

            if (!res.ok) throw new Error("Deposit failed");

            toast.success("Success", { description: "Funds added successfully!" });
            setDepositAmount("");
            fetchWalletData();
        } catch (error) {
            toast.error("Error", { description: "Could not add funds." });
        } finally {
            setDepositing(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Balance Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                        <WalletIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${balance?.toFixed(2)}</div>
                    </CardContent>
                </Card>

                {/* Deposit Card */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Add Funds (Simulation)</CardTitle>
                        <CardDescription>Add mock funds to your wallet for testing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleDeposit} className="flex gap-4 items-end">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input
                                    type="number"
                                    placeholder="Amount (e.g. 50.00)"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <Button type="submit" disabled={depositing}>
                                {depositing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Funds
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions History */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No transactions yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {tx.type === 'DEPOSIT' ? <ArrowUp className="text-green-500 h-4 w-4" /> : <ArrowDown className="text-red-500 h-4 w-4" />}
                                            {tx.type.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell>${Number(tx.amount).toFixed(2)}</TableCell>
                                        <TableCell>{tx.status}</TableCell>
                                        <TableCell className="text-right">
                                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
