import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  checkDriveAuthStatus,
  authenticateDrive
} from "@/lib/gdrive";
import {
  checkTelegramStatus,
  connectTelegramBot,
  disconnectTelegramBot,
  getNotificationSettings,
  updateNotificationSettings
} from "@/lib/telegram";

const Settings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // API Keys states
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    onUpload: true,
    onOcrComplete: true,
    onAnalysisComplete: true,
    dailySummary: false
  });
  
  // Fetch connection statuses
  const { data: driveStatus } = useQuery({
    queryKey: ['/api/drive/status'],
    staleTime: 60000,
  });
  
  const { data: telegramStatus } = useQuery({
    queryKey: ['/api/telegram/status'],
    staleTime: 60000,
  });
  
  // Fetch notification settings
  const { data: fetchedNotificationSettings } = useQuery({
    queryKey: ['/api/telegram/settings'],
    staleTime: 60000,
    onSuccess: (data) => {
      if (data) {
        setNotificationSettings(data);
      }
    }
  });
  
  // API key update mutations
  const updateApiKeysMutation = useMutation({
    mutationFn: async (data: { service: string, key: string, url?: string }) => {
      return await apiRequest('POST', '/api/settings/api-keys', data);
    },
    onSuccess: () => {
      toast({
        title: "API Keys updated",
        description: "Your API keys have been successfully updated",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update API keys",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (settings: typeof notificationSettings) => {
      return await updateNotificationSettings(settings);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle API key updates
  const handleSaveOpenAiKey = () => {
    updateApiKeysMutation.mutate({ service: 'openai', key: openaiApiKey });
  };
  
  const handleSaveSupabaseSettings = () => {
    updateApiKeysMutation.mutate({ 
      service: 'supabase', 
      key: supabaseKey,
      url: supabaseUrl
    });
  };
  
  // Handle Google Drive authentication
  const handleConnectDrive = async () => {
    try {
      const { authUrl } = await authenticateDrive();
      if (authUrl) {
        window.open(authUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Google Drive Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Google Drive",
        variant: "destructive",
      });
    }
  };
  
  // Handle Telegram bot connection
  const handleConnectTelegram = async () => {
    try {
      const { connectionCode } = await connectTelegramBot();
      toast({
        title: "Telegram Bot Connection",
        description: `Send the following code to your bot: ${connectionCode}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Telegram Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Telegram",
        variant: "destructive",
      });
    }
  };
  
  const handleDisconnectTelegram = async () => {
    try {
      await disconnectTelegramBot();
      toast({
        title: "Telegram Bot Disconnected",
        description: "Your Telegram bot has been disconnected",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/status'] });
    } catch (error) {
      toast({
        title: "Failed to disconnect",
        description: error instanceof Error ? error.message : "Failed to disconnect Telegram bot",
        variant: "destructive",
      });
    }
  };
  
  // Save notification settings
  const handleSaveNotificationSettings = () => {
    updateNotificationSettingsMutation.mutate(notificationSettings);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">Configure application settings and external services</p>
      </div>
      
      {/* Settings tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="connections">Service Connections</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        
        {/* General settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system-name">System Name</Label>
                <Input id="system-name" defaultValue="AMCP" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch id="dark-mode" />
                </div>
                <p className="text-sm text-gray-500">Enable dark mode for the application interface</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-process">Auto Process OCR</Label>
                  <Switch id="auto-process" defaultChecked />
                </div>
                <p className="text-sm text-gray-500">Automatically run OCR when documents are uploaded</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-analysis">Auto Analysis</Label>
                  <Switch id="auto-analysis" />
                </div>
                <p className="text-sm text-gray-500">Automatically run AI analysis after OCR processing</p>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Service connections */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>External Service Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Drive */}
              <div className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="ri-google-drive-line text-blue-600 text-xl mr-3"></i>
                    <div>
                      <h3 className="font-medium text-gray-900">Google Drive</h3>
                      <p className="text-sm text-gray-500">Connect to store and access documents</p>
                    </div>
                  </div>
                  
                  {driveStatus?.isAuthenticated ? (
                    <div className="space-x-2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                      <Button variant="outline" size="sm">Disconnect</Button>
                    </div>
                  ) : (
                    <Button onClick={handleConnectDrive}>Connect</Button>
                  )}
                </div>
              </div>
              
              {/* OpenAI */}
              <div className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="ri-openai-line text-gray-800 text-xl mr-3"></i>
                    <div>
                      <h3 className="font-medium text-gray-900">OpenAI</h3>
                      <p className="text-sm text-gray-500">AI-powered document analysis using GPT-4o</p>
                    </div>
                  </div>
                  
                  <div className="space-x-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
              
              {/* Telegram Bot */}
              <div className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="ri-telegram-line text-blue-500 text-xl mr-3"></i>
                    <div>
                      <h3 className="font-medium text-gray-900">Telegram Bot</h3>
                      <p className="text-sm text-gray-500">Receive notifications and updates</p>
                    </div>
                  </div>
                  
                  {telegramStatus?.isConnected ? (
                    <div className="space-x-2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                      <Button variant="outline" size="sm" onClick={handleDisconnectTelegram}>Disconnect</Button>
                    </div>
                  ) : (
                    <Button onClick={handleConnectTelegram}>Connect</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                  <Switch 
                    id="notifications-enabled" 
                    checked={notificationSettings.enabled}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, enabled: checked})
                    }
                  />
                </div>
                <p className="text-sm text-gray-500">Receive notifications about system events</p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Notification Types</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-upload">Document Uploads</Label>
                    <p className="text-xs text-gray-500">Notify when documents are uploaded</p>
                  </div>
                  <Switch 
                    id="notify-upload" 
                    checked={notificationSettings.onUpload}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, onUpload: checked})
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-ocr">OCR Processing</Label>
                    <p className="text-xs text-gray-500">Notify when OCR processing completes</p>
                  </div>
                  <Switch 
                    id="notify-ocr" 
                    checked={notificationSettings.onOcrComplete}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, onOcrComplete: checked})
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-analysis">AI Analysis</Label>
                    <p className="text-xs text-gray-500">Notify when AI analysis completes</p>
                  </div>
                  <Switch 
                    id="notify-analysis" 
                    checked={notificationSettings.onAnalysisComplete}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, onAnalysisComplete: checked})
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-daily">Daily Summary</Label>
                    <p className="text-xs text-gray-500">Receive a daily summary of activities</p>
                  </div>
                  <Switch 
                    id="notify-daily" 
                    checked={notificationSettings.dailySummary}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, dailySummary: checked})
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings}>
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Keys */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="openai-key" 
                    type="password" 
                    placeholder="sk-..." 
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                  />
                  <Button 
                    onClick={handleSaveOpenAiKey}
                    disabled={!openaiApiKey}
                  >Save</Button>
                </div>
                <p className="text-sm text-gray-500">
                  Enter your OpenAI API key for GPT-4o access. <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary-700">Get one here</a>
                </p>
              </div>
              
              <Separator />
              
              {/* Supabase Credentials */}
              <div className="space-y-2">
                <Label htmlFor="supabase-url">Supabase URL</Label>
                <Input 
                  id="supabase-url" 
                  placeholder="https://xxxxxxxxxxxx.supabase.co" 
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supabase-key">Supabase API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="supabase-key" 
                    type="password" 
                    placeholder="eyJhbGciOiJIUzI1..." 
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                  />
                  <Button 
                    onClick={handleSaveSupabaseSettings}
                    disabled={!supabaseUrl || !supabaseKey}
                  >Save</Button>
                </div>
                <p className="text-sm text-gray-500">
                  Enter your Supabase credentials for database access
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
