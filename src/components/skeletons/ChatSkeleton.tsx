import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4">
        {/* Received message */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-16 w-48 rounded-lg rounded-tl-none" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* Sent message */}
        <div className="flex gap-2 justify-end">
          <div className="space-y-1 items-end">
            <Skeleton className="h-12 w-40 rounded-lg rounded-tr-none" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>

        {/* Received message */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-24 w-56 rounded-lg rounded-tl-none" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* Sent message */}
        <div className="flex gap-2 justify-end">
          <div className="space-y-1 items-end">
            <Skeleton className="h-10 w-36 rounded-lg rounded-tr-none" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MessageBubbleSkeleton({ sent = false }: { sent?: boolean }) {
  return (
    <div className={`flex gap-2 ${sent ? 'justify-end' : ''} animate-pulse`}>
      {!sent && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
      <Skeleton 
        className={`h-12 w-40 rounded-lg ${sent ? 'rounded-tr-none' : 'rounded-tl-none'}`} 
      />
    </div>
  );
}
