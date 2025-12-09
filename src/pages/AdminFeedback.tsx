import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Filter, Search, Save, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Feedback {
  id: string;
  user_id: string;
  message: string;
  page_url: string | null;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  new: "Nieuw",
  in_progress: "In Behandeling",
  resolved: "Opgelost",
  dismissed: "Afgewezen",
};

const AdminFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data: feedback = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_feedback")
        .select(`
          *,
          profile:user_id (
            display_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Feedback[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes: string }) => {
      const { error } = await supabase
        .from("beta_feedback")
        .update({ status, admin_notes, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Feedback bijgewerkt",
        description: "De wijzigingen zijn opgeslagen.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
      setSelectedFeedback(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredFeedback = feedback.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleEditFeedback = (item: Feedback) => {
    setSelectedFeedback(item);
    setEditNotes(item.admin_notes || "");
    setEditStatus(item.status || "new");
  };

  const handleSave = () => {
    if (!selectedFeedback) return;
    updateMutation.mutate({
      id: selectedFeedback.id,
      status: editStatus,
      admin_notes: editNotes,
    });
  };

  const statusCounts = {
    all: feedback.length,
    new: feedback.filter((f) => f.status === "new").length,
    in_progress: feedback.filter((f) => f.status === "in_progress").length,
    resolved: feedback.filter((f) => f.status === "resolved").length,
    dismissed: feedback.filter((f) => f.status === "dismissed").length,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Beta Feedback</h1>
          <p className="text-muted-foreground">Beheer feedback van beta testers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusCounts).map(([key, count]) => (
            <Card
              key={key}
              className={`p-4 cursor-pointer transition-all ${
                statusFilter === key ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setStatusFilter(key)}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {key === "all" ? "Totaal" : statusLabels[key] || key}
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken in feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle status</SelectItem>
              <SelectItem value="new">Nieuw</SelectItem>
              <SelectItem value="in_progress">In Behandeling</SelectItem>
              <SelectItem value="resolved">Opgelost</SelectItem>
              <SelectItem value="dismissed">Afgewezen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFeedback.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Geen feedback gevonden</h3>
            <p className="text-muted-foreground">
              {statusFilter !== "all"
                ? "Pas je filters aan om meer resultaten te zien"
                : "Er is nog geen feedback ontvangen"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <Card
                key={item.id}
                className="p-6 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => handleEditFeedback(item)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {item.profile?.display_name || "Onbekend"}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[item.status || "new"]}
                      >
                        {statusLabels[item.status || "new"]}
                      </Badge>
                    </div>
                    <p className="text-foreground line-clamp-2 mb-2">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(item.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </span>
                      {item.page_url && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <ExternalLink className="h-3 w-3" />
                          {item.page_url}
                        </span>
                      )}
                      {item.admin_notes && (
                        <span className="text-primary">Heeft notities</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Feedback Details</DialogTitle>
            </DialogHeader>
            {selectedFeedback && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Van</label>
                  <p className="text-foreground">
                    {selectedFeedback.profile?.display_name || "Onbekend"}
                    {selectedFeedback.profile?.email && (
                      <span className="text-muted-foreground ml-2">
                        ({selectedFeedback.profile.email})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Datum</label>
                  <p className="text-foreground">
                    {format(new Date(selectedFeedback.created_at), "d MMMM yyyy 'om' HH:mm", {
                      locale: nl,
                    })}
                  </p>
                </div>
                {selectedFeedback.page_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pagina</label>
                    <p className="text-foreground">{selectedFeedback.page_url}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bericht</label>
                  <p className="text-foreground bg-muted/50 p-3 rounded-lg mt-1">
                    {selectedFeedback.message}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nieuw</SelectItem>
                      <SelectItem value="in_progress">In Behandeling</SelectItem>
                      <SelectItem value="resolved">Opgelost</SelectItem>
                      <SelectItem value="dismissed">Afgewezen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Admin Notities
                  </label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Voeg interne notities toe..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Opslaan
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminFeedback;
