import { 
  Battery, 
  Settings, 
  Smartphone, 
  Shield, 
  Bell,
  MapPin,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface BatteryOptimizationGuideProps {
  onDismiss: () => void;
}

export const BatteryOptimizationGuide = ({ onDismiss }: BatteryOptimizationGuideProps) => {

  const androidSteps = [
    {
      title: 'Open Battery Settings',
      description: 'Go to Settings → Battery → Battery Optimization',
      icon: Battery,
    },
    {
      title: 'Find Travel Alarm',
      description: 'Search for "Travel Alarm" in the app list',
      icon: Smartphone,
    },
    {
      title: 'Select "Don\'t Optimize"',
      description: 'Tap on the app and select "Don\'t optimize" or "Unrestricted"',
      icon: Shield,
    },
  ];

  const samsungSteps = [
    {
      title: 'Open Device Care',
      description: 'Settings → Battery and device care → Battery',
      icon: Battery,
    },
    {
      title: 'Background Usage Limits',
      description: 'Tap "Background usage limits" → "Never sleeping apps"',
      icon: Smartphone,
    },
    {
      title: 'Add Travel Alarm',
      description: 'Tap "+" and add Travel Alarm to the list',
      icon: Shield,
    },
  ];

  const xiaomiSteps = [
    {
      title: 'Open Battery Settings',
      description: 'Settings → Battery & performance',
      icon: Battery,
    },
    {
      title: 'App Battery Saver',
      description: 'Tap "App battery saver" and find Travel Alarm',
      icon: Smartphone,
    },
    {
      title: 'Set to No Restrictions',
      description: 'Select "No restrictions" for background activity',
      icon: Shield,
    },
    {
      title: 'Enable Autostart',
      description: 'Also enable "Autostart" in Security → Manage apps',
      icon: Settings,
    },
  ];

  const permissionChecklist = [
    { label: 'Location: Always Allow', icon: MapPin },
    { label: 'Notifications: Enabled', icon: Bell },
    { label: 'Battery: Unrestricted', icon: Battery },
    { label: 'Background Activity: Allowed', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/20 mb-4">
          <Battery className="w-8 h-8 text-warning" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Keep Alarm Active</h1>
        <p className="text-muted-foreground text-sm">
          To ensure the alarm works when your screen is off, please disable battery optimization
        </p>
      </div>

      {/* Permission Checklist */}
      <div className="glass-panel rounded-2xl p-4 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          Required Permissions
        </h3>
        <div className="space-y-2">
          {permissionChecklist.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Device-specific instructions */}
      <Accordion type="single" collapsible className="space-y-3">
        {/* Stock Android / Pixel */}
        <AccordionItem value="android" className="glass-panel rounded-2xl border-0 overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Smartphone className="w-5 h-5 text-green-500" />
              </div>
              <span className="font-medium">Stock Android / Pixel</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {androidSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Samsung */}
        <AccordionItem value="samsung" className="glass-panel rounded-2xl border-0 overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Smartphone className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-medium">Samsung Galaxy</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {samsungSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Xiaomi / Redmi / POCO */}
        <AccordionItem value="xiaomi" className="glass-panel rounded-2xl border-0 overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Smartphone className="w-5 h-5 text-orange-500" />
              </div>
              <span className="font-medium">Xiaomi / Redmi / POCO</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {xiaomiSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Other brands info */}
        <AccordionItem value="other" className="glass-panel rounded-2xl border-0 overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Smartphone className="w-5 h-5 text-purple-500" />
              </div>
              <span className="font-medium">OnePlus / Oppo / Vivo / Others</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Look for these settings in your device:
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Battery optimization → Don't optimize</li>
                <li>• App launch manager → Manual / Allow all</li>
                <li>• Background activity → Unrestricted</li>
                <li>• Autostart → Enable for Travel Alarm</li>
              </ul>
              <a 
                href="https://dontkillmyapp.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary text-sm mt-2"
              >
                <ExternalLink className="w-4 h-4" />
                View detailed guides at dontkillmyapp.com
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* iOS Note */}
      <div className="glass-panel rounded-2xl p-4 mt-6 border border-blue-500/30 bg-blue-500/10">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
            <Smartphone className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">iPhone Users</h4>
            <p className="text-xs text-muted-foreground">
              Make sure Location is set to "Always Allow" in Settings → Privacy → Location Services → Travel Alarm. 
              Also enable "Background App Refresh" for the app.
            </p>
          </div>
        </div>
      </div>

      {/* Dismiss button */}
      <div className="mt-8">
        <Button 
          onClick={onDismiss}
          className="w-full py-6 font-bold"
          size="lg"
        >
          I've Updated My Settings
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          You can access this guide anytime from Settings
        </p>
      </div>
    </div>
  );
};
