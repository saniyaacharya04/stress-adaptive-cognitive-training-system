import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Bell, Shield, Sliders, Database, Brain } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure experiment parameters and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PID Controller Settings */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sliders className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>PID Controller</CardTitle>
                <CardDescription>Adaptive difficulty parameters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Proportional Gain (Kp)</Label>
                <span className="text-sm text-muted-foreground">0.5</span>
              </div>
              <Slider defaultValue={[0.5]} max={2} step={0.1} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Integral Gain (Ki)</Label>
                <span className="text-sm text-muted-foreground">0.1</span>
              </div>
              <Slider defaultValue={[0.1]} max={1} step={0.05} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Derivative Gain (Kd)</Label>
                <span className="text-sm text-muted-foreground">0.2</span>
              </div>
              <Slider defaultValue={[0.2]} max={1} step={0.05} />
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Target Stress Level</Label>
                <span className="text-sm text-muted-foreground">0.4</span>
              </div>
              <Slider defaultValue={[0.4]} max={1} step={0.05} />
            </div>
          </CardContent>
        </Card>

        {/* Task Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/50">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Task Configuration</CardTitle>
                <CardDescription>Timing and difficulty settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stimulus Duration (ms)</Label>
                <Input type="number" defaultValue={2000} />
              </div>
              <div className="space-y-2">
                <Label>Inter-trial Interval (ms)</Label>
                <Input type="number" defaultValue={500} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trials per Block</Label>
                <Input type="number" defaultValue={20} />
              </div>
              <div className="space-y-2">
                <Label>Break Duration (s)</Label>
                <Input type="number" defaultValue={60} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Task Order</Label>
              <Select defaultValue="nback-stroop-reaction">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nback-stroop-reaction">N-Back → Stroop → Reaction</SelectItem>
                  <SelectItem value="stroop-nback-reaction">Stroop → N-Back → Reaction</SelectItem>
                  <SelectItem value="random">Randomized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial N-Back Level</Label>
              <Select defaultValue="2">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1-Back</SelectItem>
                  <SelectItem value="2">2-Back</SelectItem>
                  <SelectItem value="3">3-Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data & Export Settings */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-calm-mint/30">
                <Database className="w-5 h-5 text-stress-low" />
              </div>
              <div>
                <CardTitle>Data & Export</CardTitle>
                <CardDescription>Data collection preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save Sessions</Label>
                <p className="text-sm text-muted-foreground">Automatically save data every 30 seconds</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Raw Biometrics</Label>
                <p className="text-sm text-muted-foreground">Export raw HRV and pupil data</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Anonymize Exports</Label>
                <p className="text-sm text-muted-foreground">Remove identifiable information</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Default Export Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Alerts */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-calm-lavender/30">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Alert and monitoring preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>High Stress Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when stress exceeds threshold</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Complete Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when participant finishes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Connection Loss Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify on biometric sensor disconnect</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Stress Alert Threshold</Label>
                <span className="text-sm text-muted-foreground">0.8</span>
              </div>
              <Slider defaultValue={[0.8]} max={1} step={0.05} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stress-low/20">
                <Shield className="w-5 h-5 text-stress-low" />
              </div>
              <div>
                <CardTitle>Security & Access</CardTitle>
                <CardDescription>Authentication and access control settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue={30} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for admin access</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Rate Limit (req/min)</Label>
                  <Input type="number" defaultValue={100} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all admin actions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </Button>
        <Button className="gap-2 primary-gradient text-primary-foreground">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
