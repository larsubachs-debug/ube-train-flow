import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bell, 
  MessageSquare, 
  ClipboardCheck, 
  Dumbbell, 
  Trophy, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  CheckCheck,
  Loader2,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import { useCoachNotifications, NotificationType, CoachNotification } from "@/hooks/useCoachNotifications";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "checkin":
      return <ClipboardCheck className="w-4 h-4 text-blue-500" />;
    case "message":
      return <MessageSquare className="w-4 h-4 text-primary" />;
    case "workout":
      return <Dumbbell className="w-4 h-4 text-green-500" />;
    case "pr":
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case "stagnation":
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case "streak_broken":
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    case "milestone":
      return <TrendingUp className="w-4 h-4 text-green-500" />;
  }
};

const getNotificationBadge = (type: NotificationType) => {
  switch (type) {
    case "checkin":
      return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">Check-in</Badge>;
    case "message":
      return <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Bericht</Badge>;
    case "workout":
      return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Workout</Badge>;
    case "pr":
      return <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">PR</Badge>;
    case "stagnation":
      return <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">Inactief</Badge>;
    case "streak_broken":
      return <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">Streak</Badge>;
    case "milestone":
      return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Milestone</Badge>;
  }
};

const getNotificationLink = (notification: CoachNotification) => {
  switch (notification.type) {
    case "message":
      return `/coach/chat?member=${notification.member_id}`;
    case "checkin":
      return `/admin/checkins`;
    default:
      return `/admin/members?member=${notification.member_id}`;
  }
};

const getInitials = (name: string) => {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

interface NotificationItemProps {
  notification: CoachNotification;
  onMarkRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkRead }: NotificationItemProps) => {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
  };

  return (
    <Link
      to={getNotificationLink(notification)}
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 border-b last:border-b-0 transition-colors hover:bg-muted/50 ${
        notification.is_read ? "opacity-60" : "bg-background"
      }`}
    >
      <Avatar className="w-10 h-10 shrink-0">
        {notification.member_avatar && <AvatarImage src={notification.member_avatar} />}
        <AvatarFallback className="text-xs">
          {getInitials(notification.member_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {getNotificationIcon(notification.type)}
          <span className="font-medium text-sm">{notification.member_name}</span>
          {getNotificationBadge(notification.type)}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: nl })}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </Link>
  );
};

const CoachNotifications = () => {
  const { notifications, loading, unreadCount, refetch, markAsRead, markAllAsRead } = useCoachNotifications();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "messages") return n.type === "message";
    if (activeTab === "activity") return ["checkin", "workout"].includes(n.type);
    if (activeTab === "alerts") return ["pr", "stagnation", "streak_broken", "milestone"].includes(n.type);
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h1 className="text-xl font-bold">Notificaties</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="gap-1 text-muted-foreground"
              >
                <CheckCheck className="w-4 h-4" />
                Alles gelezen
              </Button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">Alles</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs">Berichten</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activiteit</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Geen notificaties</h2>
          <p className="text-muted-foreground text-sm">
            {activeTab === "all" 
              ? "Je hebt nog geen notificaties ontvangen"
              : `Geen ${activeTab === "messages" ? "berichten" : activeTab === "activity" ? "activiteit" : "alerts"}`
            }
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CoachNotifications;
