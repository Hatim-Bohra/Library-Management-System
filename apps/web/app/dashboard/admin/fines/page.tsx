'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function AdminFinesPage() {
    const queryClient = useQueryClient();
    const { data: rules, isLoading } = useQuery({
        queryKey: ['fine-rules'],
        queryFn: async () => {
            // Mocking response as the endpoint returns array of rules
            // If array, we probably just want to edit 'MEMBER' role rule or map them.
            // For simplicity, let's assume we edit MEMBER rule.
            const { data } = await api.get('/fines/rules');
            return data;
        }
    });

    // TODO: Improve to handle multiple roles. Currently assuming single rule edit for demo.

    if (isLoading) return <div>Loading rules...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Fine Configuration</h2>
            <div className="grid gap-4 md:grid-cols-2">
                {rules?.map((rule: any) => (
                    <FineRuleForm key={rule.id} rule={rule} />
                ))}
                {!rules?.length && <p>No rules found. (Start server or seed data)</p>}
            </div>
        </div>
    );
}

function FineRuleForm({ rule }: { rule: any }) {
    const queryClient = useQueryClient();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            gracePeriod: rule.gracePeriod,
            dailyRate: rule.dailyRate,
            maxFine: rule.maxFine,
            lostBookProcessingFee: rule.lostBookProcessingFee
        }
    });

    const mutation = useMutation({
        mutationFn: async (values: any) => {
            await api.put(`/fines/rules/${rule.role}`, {
                gracePeriod: Number(values.gracePeriod),
                dailyRate: Number(values.dailyRate),
                maxFine: Number(values.maxFine),
                lostBookProcessingFee: Number(values.lostBookProcessingFee)
            });
        },
        onSuccess: () => {
            alert('Rule updated');
            queryClient.invalidateQueries({ queryKey: ['fine-rules'] });
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>{rule.role} Rules</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label>Grace Period (Days)</Label>
                        <Input type="number" {...register('gracePeriod')} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label>Daily Rate</Label>
                        <Input type="number" step="0.01" {...register('dailyRate')} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label>Max Fine Cap</Label>
                        <Input type="number" step="0.01" {...register('maxFine')} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label>Lost Book Fee</Label>
                        <Input type="number" step="0.01" {...register('lostBookProcessingFee')} />
                    </div>
                    <Button type="submit" disabled={mutation.isPending}>Save Changes</Button>
                </form>
            </CardContent>
        </Card>
    )
}
