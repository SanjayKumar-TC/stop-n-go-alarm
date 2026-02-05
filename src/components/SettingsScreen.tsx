import { useState } from 'react';
import { ArrowLeft, Sun, Moon, Monitor, Bell, BellOff, Vibrate, Volume2, VolumeX, Play, Battery, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/hooks/useTheme';
import { AlarmSettings, AlarmTone } from '@/hooks/useAlarm';
import { BatteryOptimizationGuide } from '@/components/BatteryOptimizationGuide';

interface SettingsScreenProps {
  alarmSettings: AlarmSettings;
  isAlarmRinging?: boolean;
  onUpdateSettings: (settings: Partial<AlarmSettings>) => void;
  onTestAlarm: () => void;
  onBack: () => void;
}

const TONE_OPTIONS: { value: AlarmTone; label: string; description: string }[] = [
  { value: 'gentle', label: 'Gentle', description: 'Soft, calming wake-up tone' },
  { value: 'melody', label: 'Melody', description: 'Soothing harmonic sound' },
  { value: 'waves', label: 'Waves', description: 'Relaxing, flowing rhythm' },
];

export const SettingsScreen = ({
  alarmSettings,
  isAlarmRinging = false,
  onUpdateSettings,
  onTestAlarm,
  onBack,
}: SettingsScreenProps) => {
  const { theme, setTheme } = useTheme();
  const [showBatteryGuide, setShowBatteryGuide] = useState(false);

  // Show battery optimization guide
  if (showBatteryGuide) {
    return <BatteryOptimizationGuide onDismiss={() => setShowBatteryGuide(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-panel sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4 pt-10 safe-area-top">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Appearance Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Appearance
          </h2>
          <div className="glass-panel rounded-xl divide-y divide-border">
            <button
              onClick={() => setTheme('light')}
              className={`w-full flex items-center justify-between p-4 transition-colors ${
                theme === 'light' ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-yellow-500" />
                <span className="text-foreground">Light</span>
              </div>
              {theme === 'light' && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`w-full flex items-center justify-between p-4 transition-colors ${
                theme === 'dark' ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-blue-400" />
                <span className="text-foreground">Dark</span>
              </div>
              {theme === 'dark' && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`w-full flex items-center justify-between p-4 transition-colors ${
                theme === 'system' ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">System</span>
              </div>
              {theme === 'system' && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </section>

        {/* Alarm Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Alarm
          </h2>
          <div className="glass-panel rounded-xl divide-y divide-border">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {alarmSettings.sound ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-foreground">Sound</p>
                  <p className="text-xs text-muted-foreground">Play alarm tone</p>
                </div>
              </div>
              <Switch
                checked={alarmSettings.sound}
                onCheckedChange={(checked) => onUpdateSettings({ sound: checked })}
              />
            </div>

            {/* Vibration Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Vibrate className={`w-5 h-5 ${alarmSettings.vibrate ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-foreground">Vibration</p>
                  <p className="text-xs text-muted-foreground">Vibrate on alarm</p>
                </div>
              </div>
              <Switch
                checked={alarmSettings.vibrate}
                onCheckedChange={(checked) => onUpdateSettings({ vibrate: checked })}
              />
            </div>

            {/* Volume Slider */}
            {alarmSettings.sound && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Volume</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(alarmSettings.volume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[alarmSettings.volume * 100]}
                  onValueChange={([value]) => onUpdateSettings({ volume: value / 100 })}
                  min={10}
                  max={100}
                  step={10}
                  className="py-2"
                />
              </div>
            )}
          </div>
        </section>

        {/* Alarm Tone Section */}
        {alarmSettings.sound && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Alarm Tone
            </h2>
            <div className="glass-panel rounded-xl divide-y divide-border">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => onUpdateSettings({ tone: tone.value })}
                  className={`w-full flex items-center justify-between p-4 transition-colors ${
                    alarmSettings.tone === tone.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bell className={`w-5 h-5 ${
                      alarmSettings.tone === tone.value ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div className="text-left">
                      <p className="text-foreground">{tone.label}</p>
                      <p className="text-xs text-muted-foreground">{tone.description}</p>
                    </div>
                  </div>
                  {alarmSettings.tone === tone.value && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Test Alarm Button */}
        <Button
          onClick={onTestAlarm}
          variant={isAlarmRinging ? "destructive" : "outline"}
          className="w-full"
          disabled={!alarmSettings.sound && !alarmSettings.vibrate}
        >
          {isAlarmRinging ? (
            <>
              <BellOff className="w-4 h-4 mr-2" />
              Stop Alarm
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Test Alarm
            </>
          )}
        </Button>

        {/* Battery Optimization Guide */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Background Operation
          </h2>
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/20 flex-shrink-0">
                <Battery className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">Battery Optimization</p>
                <p className="text-xs text-muted-foreground mt-1">
                  To ensure the alarm works when your screen is off, you may need to disable battery optimization for this app.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowBatteryGuide(true)}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  View Setup Guide
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* App Info */}
        <section className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            Travel Alarm v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Never miss your stop again
          </p>
        </section>
      </div>
    </div>
  );
};
