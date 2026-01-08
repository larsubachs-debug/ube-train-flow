import { supabase } from "@/integrations/supabase/client";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getVapidPublicKey = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
    if (error) {
      console.error('Error fetching VAPID key:', error);
      return null;
    }
    return data?.publicKey || null;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('This browser does not support service workers');
    return false;
  }

  const permission = await Notification.requestPermission();
  
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return false;
  }

  return true;
};

export const subscribeToPushNotifications = async (userId: string) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    // Get VAPID public key from backend
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.error('Could not get VAPID public key');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Save subscription to database
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) return null;

    // Store push subscription in database
    const { error } = await supabase
      .from('push_subscriptions' as any)
      .upsert({
        user_id: userId,
        profile_id: profile.id,
        subscription: JSON.stringify(subscription),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

export const unsubscribeFromPushNotifications = async (userId: string) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from database
    await supabase
      .from('push_subscriptions' as any)
      .delete()
      .eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

export const checkNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};
