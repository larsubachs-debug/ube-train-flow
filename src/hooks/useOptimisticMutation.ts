import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface OptimisticMutationOptions<TData, TVariables, TContext> {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  // Function to optimistically update the cache
  getOptimisticData?: (
    currentData: TData[] | undefined,
    variables: TVariables
  ) => TData[];
  // Function to find the item to update/delete
  findItem?: (item: TData, variables: TVariables) => boolean;
  // Type of mutation for auto-handling
  mutationType?: "create" | "update" | "delete";
  // Success message
  successMessage?: string;
  // Error message
  errorMessage?: string;
  // Callbacks
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useOptimisticMutation<
  TData extends { id?: string },
  TVariables extends { id?: string }
>({
  queryKey,
  mutationFn,
  getOptimisticData,
  findItem,
  mutationType,
  successMessage,
  errorMessage = "Er ging iets mis",
  onSuccess,
  onError,
}: OptimisticMutationOptions<TData, TVariables, TData[]>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically update cache
      if (previousData !== undefined) {
        let optimisticData: TData[];

        if (getOptimisticData) {
          optimisticData = getOptimisticData(previousData, variables);
        } else if (mutationType && findItem) {
          switch (mutationType) {
            case "create":
              optimisticData = [...previousData, variables as unknown as TData];
              break;
            case "update":
              optimisticData = previousData.map((item) =>
                findItem(item, variables) ? { ...item, ...variables } : item
              );
              break;
            case "delete":
              optimisticData = previousData.filter(
                (item) => !findItem(item, variables)
              );
              break;
            default:
              optimisticData = previousData;
          }
        } else {
          optimisticData = previousData;
        }

        queryClient.setQueryData(queryKey, optimisticData);
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive",
      });

      onError?.(error as Error);
    },
    onSuccess: (data) => {
      if (successMessage) {
        toast({
          title: "Gelukt",
          description: successMessage,
        });
      }

      onSuccess?.(data);
    },
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Simplified hook for common patterns
export function useOptimisticCreate<TData extends { id?: string }>(
  queryKey: QueryKey,
  mutationFn: (data: Omit<TData, "id">) => Promise<TData>,
  successMessage = "Succesvol toegevoegd"
) {
  return useOptimisticMutation<TData, Omit<TData, "id">>({
    queryKey,
    mutationFn,
    mutationType: "create",
    successMessage,
  });
}

export function useOptimisticUpdate<TData extends { id: string }>(
  queryKey: QueryKey,
  mutationFn: (data: Partial<TData> & { id: string }) => Promise<TData>,
  successMessage = "Succesvol bijgewerkt"
) {
  return useOptimisticMutation<TData, Partial<TData> & { id: string }>({
    queryKey,
    mutationFn,
    mutationType: "update",
    findItem: (item, variables) => item.id === variables.id,
    successMessage,
  });
}

export function useOptimisticDelete<TData extends { id: string }>(
  queryKey: QueryKey,
  mutationFn: (id: string) => Promise<void>,
  successMessage = "Succesvol verwijderd"
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id }: { id: string }) => mutationFn(id),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TData[]>(queryKey);
      
      if (previousData) {
        queryClient.setQueryData(
          queryKey,
          previousData.filter((item) => item.id !== variables.id)
        );
      }
      
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({
        title: "Fout",
        description: "Verwijderen mislukt",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      if (successMessage) {
        toast({
          title: "Gelukt",
          description: successMessage,
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
