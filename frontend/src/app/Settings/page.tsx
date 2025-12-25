"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Mail, MessageSquare, HardDrive, Building2, Settings, Save, X, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSystemConfigStore } from "@/store/useSystemConfigStore"
import api from "@/Utils/Request"

type Contact = {
  id: string
  systemConfigId?: string
  email: string
  telephone: string
}

type BusinessConfig = {
  id?: string
  organisationName: string
  organisationDescription: string
  currency: string
  registeredBusinessName?: string
  registeredBusinessContact?: string
  registeredTINumber?: string
  registeredBusinessAddress?: string
  fiscalYearStart?: string
  fiscalYearEnd?: string
  imsKey?: string
  imsVersion?: string
  licenseValidTill?: string
  logo?: string
  contacts: Contact[]
}

type EmailConfig = {
  id: string
  smtpServer: string
  smtpPort: number
  senderEmail: string
  senderPassword: string
  senderName: string
  enableSSL: boolean
  isActive: boolean
}

type SMSConfig = {
  id: string
  provider: string
  apiKey: string
  apiSecret: string
  senderID: string
  isActive: boolean
}

type BackupConfig = {
  id: string
  autoBackupEnabled: boolean
  backupFrequency: "daily" | "weekly" | "monthly"
  lastBackupDate: string
  backupLocation: string
  retentionDays: number
}

const defaultBusinessConfig: BusinessConfig = {
  organisationName: "",
  organisationDescription: "",
  currency: "UGX", // UGX default
  registeredBusinessName: "",
  registeredBusinessContact: "",
  registeredTINumber: "",
  registeredBusinessAddress: "",
  fiscalYearStart: "",
  fiscalYearEnd: "",
  imsKey: "",
  imsVersion: "",
  licenseValidTill: "",
  logo: "",
  contacts: [],
}

const mockEmailConfig: EmailConfig = {
  id: "1",
  smtpServer: "smtp.gmail.com",
  smtpPort: 587,
  senderEmail: "noreply@pharmasolutions.com",
  senderPassword: "••••••••••••••••",
  senderName: "Pharma Solutions",
  enableSSL: true,
  isActive: true,
}

const mockSMSConfig: SMSConfig = {
  id: "1",
  provider: "Twilio",
  apiKey: "••••••••••••••••",
  apiSecret: "••••••••••••••••",
  senderID: "PHARMA",
  isActive: true,
}

const mockBackupConfig: BackupConfig = {
  id: "1",
  autoBackupEnabled: true,
  backupFrequency: "daily",
  lastBackupDate: new Date().toISOString(),
  backupLocation: "/backups/pharma",
  retentionDays: 30,
}

export default function SettingsPage() {
  const { config, isLoading, error, saveSystemConfig } = useSystemConfigStore()
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(defaultBusinessConfig)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(mockEmailConfig)
  const [smsConfig, setSMSConfig] = useState<SMSConfig>(mockSMSConfig)
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(mockBackupConfig)
  const [newContact, setNewContact] = useState<Contact>({ id: "", email: "", telephone: "" })
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isEditingSMS, setIsEditingSMS] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Sync store config to local state when it changes
  useEffect(() => {
    if (config) {
      setBusinessConfig({
        ...config,
        currency: config.currency,
        contacts: config.contacts || [],
      })
    } else {
      setBusinessConfig(defaultBusinessConfig as BusinessConfig)
    }
  }, [config])

  const handleBusinessConfigChange = (field: keyof Omit<BusinessConfig, "id" | "contacts">, value: string | number) => {
    setBusinessConfig((prev) => ({
      ...prev,
      [field]: value as string,
    }))
  }

  const handleAddContact = async () => {
    if (!newContact.email || !newContact.telephone) {
      toast({ title: "Error", description: "Please fill in all contact fields", className: "bg-primary text-black dark:bg-gray-700 dark:text-white" })
      return
    }
    
    try {
      const response = await api.post("/SystemConfig/Contacts", {
        email: newContact.email,
        telephone: newContact.telephone,
      })
      
      // Refresh contacts from the store
      await useSystemConfigStore.getState().fetchSystemConfig()
      
      setNewContact({ id: "", email: "", telephone: "" })
      toast({ title: "Success", description: "Contact added successfully", className: "bg-primary text-black dark:bg-gray-700 dark:text-white" })
    } catch (error: any) {
      console.error("Error adding contact:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add contact",
        variant: "destructive",
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white"
      })
    }
  }

  const handleRemoveContact = async (id: string) => {
    try {
      await api.delete(`/SystemConfig/Contacts/${id}`)
      
      // Refresh contacts from the store
      await useSystemConfigStore.getState().fetchSystemConfig()
      
      toast({ title: "Success", description: "Contact removed", className: "bg-primary text-black dark:bg-gray-700 dark:text-white" })
    } catch (error: any) {
      console.error("Error removing contact:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove contact",
        variant: "destructive",
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white"
      })
    }
  }

  const handleSaveBusinessConfig = async () => {
    setIsSaving(true)
    try {
      // Prepare config for saving - exclude contacts as they have their own endpoints
      const { contacts, ...configWithoutContacts } = businessConfig
      const configToSave = {
        ...configWithoutContacts,
      }

      await saveSystemConfig(configToSave)
      
      toast({ 
        title: "Success", 
        description: businessConfig.id 
          ? "Business configuration updated successfully" 
          : "Business configuration created successfully", 
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white" 
      })
    } catch (error: any) {
      console.error("Error saving system config:", error)
      toast({
        title: "Error",
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        description: error.response?.data?.message || "Failed to save business configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEmailConfig = () => {
    setIsEditingEmail(false)
    toast({ title: "Success", description: "Email configuration saved", className: "bg-primary text-black dark:bg-gray-700 dark:text-white" })
  }

  const handleSaveSMSConfig = () => {
    setIsEditingSMS(false)
    toast({ title: "Success", description: "SMS configuration saved", className: "bg-primary text-black dark:bg-gray-700 dark:text-white" })
  }

  const handleBackup = () => {
    toast({ title: "Success", description: "Backup initiated successfully", className: "bg-primary text-black dark:bg-gray-700 dark:text-white" })
  }

  const handleRestore = () => {
    toast({ title: "Restore", description: "Select a backup file to restore", className: "bg-primary text-black dark:bg-gray-700 dark:text-white" })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your business configuration and system preferences</p>
        </div>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800 bg-white">
          <TabsTrigger value="business" className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <Building2 className="h-4 w-4" />
            Business Details
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <Mail className="h-4 w-4" />
            Email Config
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <MessageSquare className="h-4 w-4" />
            SMS Config
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <HardDrive className="h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Business Details Tab */}
        <TabsContent value="business" className="space-y-6">
          {isLoading ? (
            <Card className="dark:bg-gray-800 bg-white">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <>
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Configure your business details and legal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={businessConfig.organisationName}
                    onChange={(e) => handleBusinessConfigChange("organisationName", e.target.value)}
                    className="dark:bg-gray-700 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={businessConfig.currency}
                    onChange={(e) => handleBusinessConfigChange("currency", e.target.value)}
                    className="w-full px-3 py-2 border dark:bg-gray-700 bg-white rounded-md"
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                    <option value="CHF">CHF</option>
                    <option value="CNY">CNY</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-desc">Organization Description</Label>
                <Textarea
                  id="org-desc"
                  value={businessConfig.organisationDescription}
                  onChange={(e) => handleBusinessConfigChange("organisationDescription", e.target.value)}
                  className="dark:bg-gray-700 bg-white min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Registered Business Name</Label>
                  <Input
                    id="reg-name"
                    value={businessConfig.registeredBusinessName}
                    onChange={(e) => handleBusinessConfigChange("registeredBusinessName", e.target.value)}
                    className="dark:bg-gray-700 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ti-number">Tax ID Number</Label>
                  <Input
                    id="ti-number"
                    value={businessConfig.registeredTINumber}
                    onChange={(e) => handleBusinessConfigChange("registeredTINumber", e.target.value)}
                    className="dark:bg-gray-700 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={businessConfig.registeredBusinessAddress}
                  onChange={(e) => handleBusinessConfigChange("registeredBusinessAddress", e.target.value)}
                  className="dark:bg-gray-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fiscal-start">Fiscal Year Start</Label>
                  <Input
                    id="fiscal-start"
                    type="date"
                    value={businessConfig.fiscalYearStart}
                    onChange={(e) => handleBusinessConfigChange("fiscalYearStart", e.target.value)}
                    className="dark:bg-gray-700 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal-end">Fiscal Year End</Label>
                  <Input
                    id="fiscal-end"
                    type="date"
                    value={businessConfig.fiscalYearEnd}
                    onChange={(e) => handleBusinessConfigChange("fiscalYearEnd", e.target.value)}
                    className="dark:bg-gray-700 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license-valid">License Valid Till</Label>
                  <Input
                    id="license-valid"
                    type="date"
                    value={businessConfig.licenseValidTill ? businessConfig.licenseValidTill.split("T")[0] : ""}
                    onChange={(e) => handleBusinessConfigChange("licenseValidTill", e.target.value)}
                    disabled
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ims-key">IMS Key</Label>
                  <Input
                    id="ims-key"
                    value={businessConfig.imsKey}
                    onChange={(e) => handleBusinessConfigChange("imsKey", e.target.value)}
                    disabled
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ims-version">IMS Version</Label>
                  <Input
                    id="ims-version"
                    value={businessConfig.imsVersion}
                    onChange={(e) => handleBusinessConfigChange("imsVersion", e.target.value)}
                    disabled
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts Section */}
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Manage organization contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {businessConfig.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 dark:bg-gray-700 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{contact.email}</p>
                      <p className="text-sm text-muted-foreground">{contact.telephone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t dark:border-gray-700 pt-6 space-y-4">
                <h4 className="font-semibold">Add New Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="email@example.com"
                      className="dark:bg-gray-700 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Telephone</Label>
                    <Input
                      id="contact-phone"
                      value={newContact.telephone}
                      onChange={(e) => setNewContact({ ...newContact, telephone: e.target.value })}
                      placeholder="+1-555-0100"
                      className="dark:bg-gray-700 bg-white"
                    />
                  </div>
                </div>
                <Button onClick={handleAddContact} className="w-full md:w-auto dark:bg-gray-700 bg-white">
                  <Building2 className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              <Button 
                onClick={handleSaveBusinessConfig} 
                className="w-full dark:bg-gray-700 bg-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Business Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </>
          )}
        </TabsContent>

        {/* Email Configuration Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Setup SMTP for email notifications</CardDescription>
              </div>
              <Button
                variant={isEditingEmail ? "default" : "outline"}
                onClick={() => setIsEditingEmail(!isEditingEmail)}
                className="dark:bg-gray-700 bg-white"
              >
                {isEditingEmail ? "Done" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailConfig.isActive && (
                <Alert className="dark:bg-gray-700 bg-green-50 border-green-200">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">Email service is active and configured</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input
                    id="smtp-server"
                    value={emailConfig.smtpServer}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpServer: e.target.value })}
                    disabled={!isEditingEmail}
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={emailConfig.smtpPort}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: Number.parseInt(e.target.value) })}
                    disabled={!isEditingEmail}
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={emailConfig.senderEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                    disabled={!isEditingEmail}
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Sender Name</Label>
                  <Input
                    id="sender-name"
                    value={emailConfig.senderName}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                    disabled={!isEditingEmail}
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender-password">Sender Password</Label>
                <Input
                  id="sender-password"
                  type="password"
                  value={emailConfig.senderPassword}
                  onChange={(e) => setEmailConfig({ ...emailConfig, senderPassword: e.target.value })}
                  disabled={!isEditingEmail}
                  className="dark:bg-gray-700 bg-white disabled:opacity-60"
                />
              </div>

              <div className="flex items-center gap-4 p-4 dark:bg-gray-700 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Enable SSL/TLS</p>
                  <p className="text-sm text-muted-foreground">Secure connection for email</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailConfig.enableSSL}
                  onChange={(e) => setEmailConfig({ ...emailConfig, enableSSL: e.target.checked })}
                  disabled={!isEditingEmail}
                  className="w-4 h-4"
                />
              </div>

              {isEditingEmail && (
                <Button onClick={handleSaveEmailConfig} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Configuration
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Email Test Section */}
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Test Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Send a test email to verify your SMTP configuration</p>
              <Button variant="outline" className="w-full bg-transparent dark:bg-gray-700 bg-white">
                <Mail className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Configuration Tab */}
        <TabsContent value="sms" className="space-y-6">
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>SMS Configuration</CardTitle>
                <CardDescription>Setup SMS messaging provider</CardDescription>
              </div>
              <Button variant={isEditingSMS ? "default" : "outline"} onClick={() => setIsEditingSMS(!isEditingSMS)} className="dark:bg-gray-700 bg-white">
                {isEditingSMS ? "Done" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {smsConfig.isActive && (
                <Alert className="dark:bg-gray-700 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-600">SMS service is active and configured</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="sms-provider">SMS Provider</Label>
                <select
                  id="sms-provider"
                  value={smsConfig.provider}
                  onChange={(e) => setSMSConfig({ ...smsConfig, provider: e.target.value })}
                  disabled={!isEditingSMS}
                  className="w-full px-3 py-2 border dark:bg-gray-700 bg-white rounded-md disabled:opacity-60"
                >
                  <option>Twilio</option>
                  <option>AWS SNS</option>
                  <option>Nexmo</option>
                  <option>Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sms-api-key">API Key</Label>
                  <Input
                    id="sms-api-key"
                    type="password"
                    value={smsConfig.apiKey}
                    onChange={(e) => setSMSConfig({ ...smsConfig, apiKey: e.target.value })}
                    disabled={!isEditingSMS}
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-api-secret">API Secret</Label>
                  <Input
                    id="sms-api-secret"
                    type="password"
                    value={smsConfig.apiSecret}
                    onChange={(e) => setSMSConfig({ ...smsConfig, apiSecret: e.target.value })}
                    disabled={!isEditingSMS}
                    className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-sender">Sender ID</Label>
                <Input
                  id="sms-sender"
                  value={smsConfig.senderID}
                  onChange={(e) => setSMSConfig({ ...smsConfig, senderID: e.target.value })}
                  disabled={!isEditingSMS}
                  className="dark:bg-gray-700 bg-white disabled:opacity-60"
                  placeholder="PHARMA"
                />
              </div>

              <div className="flex items-center gap-4 p-4 dark:bg-gray-700 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Enable SMS Service</p>
                  <p className="text-sm text-muted-foreground">Activate SMS notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsConfig.isActive}
                  onChange={(e) => setSMSConfig({ ...smsConfig, isActive: e.target.checked })}
                  disabled={!isEditingSMS}
                  className="w-4 h-4"
                />
              </div>

              {isEditingSMS && (
                <Button onClick={handleSaveSMSConfig} className="w-full dark:bg-gray-700 bg-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save SMS Configuration
                </Button>
              )}
            </CardContent>
          </Card>

          {/* SMS Test Section */}
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Test SMS Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Send a test SMS to verify your configuration</p>
              <div className="space-y-2">
                <Label htmlFor="test-phone">Phone Number</Label>
                <Input id="test-phone" placeholder="+1-555-0100" className="dark:bg-gray-700 bg-white" />
              </div>
              <Button variant="outline" className="w-full bg-transparent dark:bg-gray-700 bg-white">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Test SMS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Recovery Tab */}
        <TabsContent value="backup" className="space-y-6">
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle>Backup Management</CardTitle>
              <CardDescription>Configure automatic backups and data recovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 dark:bg-gray-700 bg-blue-50 rounded-lg border dark:border-gray-600 border-blue-200">
                <p className="text-sm font-medium">Last Backup</p>
                <p className="text-lg font-semibold mt-1">{new Date(backupConfig.lastBackupDate).toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 dark:bg-gray-700 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Automatic Backup</p>
                    <p className="text-sm text-muted-foreground">Enable scheduled backups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupConfig.autoBackupEnabled}
                    onChange={(e) => setBackupConfig({ ...backupConfig, autoBackupEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>

                {backupConfig.autoBackupEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="backup-freq">Backup Frequency</Label>
                      <select
                        id="backup-freq"
                        value={backupConfig.backupFrequency}
                        onChange={(e) =>
                          setBackupConfig({
                            ...backupConfig,
                            backupFrequency: e.target.value as "daily" | "weekly" | "monthly",
                          })
                        }
                        className="w-full px-3 py-2 border dark:bg-gray-700 bg-white rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retention">Retention Period (days)</Label>
                      <Input
                        id="retention"
                        type="number"
                        value={backupConfig.retentionDays}
                        onChange={(e) =>
                          setBackupConfig({
                            ...backupConfig,
                            retentionDays: Number.parseInt(e.target.value),
                          })
                        }
                        className="dark:bg-gray-700 bg-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-loc">Backup Location</Label>
                <Input
                  id="backup-loc"
                  value={backupConfig.backupLocation}
                  onChange={(e) => setBackupConfig({ ...backupConfig, backupLocation: e.target.value })}
                  className="dark:bg-gray-700 bg-white"
                  placeholder="/backups"
                />
              </div>

              <div className="border-t dark:border-gray-700 pt-6 space-y-3">
                <Button onClick={handleBackup} className="w-full dark:bg-gray-700 bg-white">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Create Backup Now
                </Button>
                <Button onClick={handleRestore} variant="outline" className="w-full bg-transparent dark:bg-gray-700 bg-white">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup History */}
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Recent Backups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: new Date(Date.now() - 86400000), size: "245 MB" },
                  { date: new Date(Date.now() - 172800000), size: "243 MB" },
                  { date: new Date(Date.now() - 259200000), size: "241 MB" },
                ].map((backup, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 dark:bg-gray-700 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{backup.date.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{backup.size}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
