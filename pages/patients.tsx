import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { requireDoctor } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, FileText } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useSupabase } from './_app';
import { edgeFunctions } from '@/lib/edge-functions';

interface PatientSummary {
  name: string;
  clientId?: string;
  lastVisit?: string;
  documentCount: number;
}

export default function PatientsPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const data = await edgeFunctions.documents.list(supabase, { limit: 100 });
        const map = new Map<string, PatientSummary>();
        (data.documents || []).forEach((doc: any) => {
          const name = doc.patient_name || doc.patient_data?.patient_name || 'Unknown';
          const existing = map.get(name);
          const lastVisit = doc.date_of_service;
          if (existing) {
            existing.documentCount += 1;
            if (lastVisit && (!existing.lastVisit || lastVisit > existing.lastVisit)) {
              existing.lastVisit = lastVisit;
            }
          } else {
            map.set(name, {
              name,
              clientId: doc.client_id || doc.patient_data?.client_id,
              lastVisit,
              documentCount: 1,
            });
          }
        });
        setPatients(Array.from(map.values()));
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchPatients();
  }, [supabase]);

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Patients | GoldStandard Clinical</title>
      </Head>
      <div className="min-h-screen bg-background pb-28">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-5 bg-background/90 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Patients</h1>
              <p className="text-xs text-muted-foreground">Search clinical history by patient</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/doctor?tab=generate')}>
            Generate Note
          </Button>
        </header>

        <main className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" /> Patient Search
              </CardTitle>
              <CardDescription>Find a patient and jump to their history</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name..."
                data-testid="input-search-patients"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Patient Summary
              </CardTitle>
              <CardDescription>
                {loading ? 'Loading patients...' : `${filteredPatients.length} patients found`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.name}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{patient.name}</h3>
                      {patient.clientId && (
                        <Badge variant="outline" className="text-xs">
                          ID: {patient.clientId}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Badge variant="secondary">{patient.documentCount} docs</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx: any) => {
  return requireDoctor(ctx);
};
