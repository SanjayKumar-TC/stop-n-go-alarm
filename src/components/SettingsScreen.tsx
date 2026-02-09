import { useState } from 'react';
import { ArrowLeft, Sun, Moon, Monitor, Bell, BellOff, Vibrate, Volume2, VolumeX, Play, Battery, HelpCircle, ChevronDown, Palette, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/hooks/useTheme';
import { useUITheme, UI_THEME_OPTIONS } from '@/hooks/useUITheme';
import { useDesignTheme, DESIGN_THEME_OPTIONS } from '@/hooks/useDesignTheme';
import { AlarmSettings, AlarmTone } from '@/hooks/useAlarm';
import { BatteryOptimizationGuide } from '@/components/BatteryOptimizationGuide';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { uiTheme, setUITheme } = useUITheme();
  const { designTheme, setDesignTheme } = useDesignTheme();
  const [showBatteryGuide, setShowBatteryGuide] = useState(false);

  // Show battery optimization guide
  if (showBatteryGuide) {
    return <BatteryOptimizationGuide onDismiss={() => setShowBatteryGuide(false)} />;
  }

  const currentUITheme = UI_THEME_OPTIONS.find(t => t.id === uiTheme) || UI_THEME_OPTIONS[0];

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
          <div className="glass-panel design-card rounded-xl divide-y divide-border">
            <button
              onClick={() => setTheme('light')}
              className={`w-full flex items-center justify-between p-4 transition-colors ${
                theme === 'light' ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-warning" />
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
                <Moon className="w-5 h-5 text-primary" />
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

        {/* Color Theme Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Color Theme
          </h2>
          <div className="glass-panel design-card rounded-xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: currentUITheme.primaryColor }}
                    />
                    <div className="text-left">
                      <p className="text-foreground">{currentUITheme.label}</p>
                      <p className="text-xs text-muted-foreground">{currentUITheme.description}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-80 bg-background border border-border shadow-lg z-[100] max-h-[70vh] overflow-y-auto"
              >
                {UI_THEME_OPTIONS.map((themeOption) => (
                  <DropdownMenuItem
                    key={themeOption.id}
                    onClick={() => setUITheme(themeOption.id)}
                    className={`flex flex-col gap-2 p-3 cursor-pointer ${
                      uiTheme === themeOption.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div 
                          className="w-4 h-4 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: themeOption.lightColor }}
                          title="Light mode"
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: themeOption.darkColor }}
                          title="Dark mode"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm font-medium">{themeOption.label}</p>
                        <p className="text-xs text-muted-foreground">{themeOption.description}</p>
                      </div>
                      {uiTheme === themeOption.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    {/* Live Preview Panel */}
                    <div className="w-full rounded-lg border border-border bg-muted/30 p-2 mt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Primary Button Preview */}
                        <div 
                          className="px-3 py-1 rounded-md text-xs font-medium text-white"
                          style={{ backgroundColor: themeOption.primaryColor }}
                        >
                          Button
                        </div>
                        {/* Outline Button Preview */}
                        <div 
                          className="px-3 py-1 rounded-md text-xs font-medium border-2 bg-transparent"
                          style={{ borderColor: themeOption.primaryColor, color: themeOption.primaryColor }}
                        >
                          Outline
                        </div>
                        {/* Badge Preview */}
                        <div 
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                          style={{ backgroundColor: themeOption.primaryColor }}
                        >
                          Badge
                        </div>
                        {/* Switch/Toggle Preview */}
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-8 h-4 rounded-full flex items-center px-0.5"
                            style={{ backgroundColor: themeOption.primaryColor }}
                          >
                            <div className="w-3 h-3 rounded-full bg-white ml-auto" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* Design Theme Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Design Style
          </h2>
          <div className="glass-panel rounded-xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Layout className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-foreground">{DESIGN_THEME_OPTIONS.find(d => d.id === designTheme)?.label}</p>
                      <p className="text-xs text-muted-foreground">{DESIGN_THEME_OPTIONS.find(d => d.id === designTheme)?.description}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-80 bg-background border border-border shadow-lg z-[100] max-h-[70vh] overflow-y-auto"
              >
                {DESIGN_THEME_OPTIONS.map((designOption) => (
                  <DropdownMenuItem
                    key={designOption.id}
                    onClick={() => setDesignTheme(designOption.id)}
                    className={`flex flex-col gap-2 p-3 cursor-pointer ${
                      designTheme === designOption.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1">
                        <p className="text-foreground text-sm font-medium">{designOption.label}</p>
                        <p className="text-xs text-muted-foreground">{designOption.description}</p>
                      </div>
                      {designTheme === designOption.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    {/* Design Preview */}
                    <div 
                      className="w-full p-3 mt-1"
                      style={{
                        borderRadius: designOption.previewStyle.radius,
                        border: designOption.previewStyle.border,
                        boxShadow: designOption.previewStyle.shadow,
                        background: designOption.previewStyle.bg,
                        fontFamily: designOption.previewStyle.font || 'inherit',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-xs font-medium text-foreground">Preview Card</span>
                      </div>
                      <div className="flex gap-2">
                        <div 
                          className="px-3 py-1 text-xs font-medium text-primary-foreground bg-primary"
                          style={{ 
                            borderRadius: designOption.id === 'rounded' ? '12px' : designOption.id === 'sharp' || designOption.id === 'brutalist' || designOption.id === 'retro' ? '0' : '6px',
                            fontFamily: designOption.previewStyle.font || 'inherit',
                            fontWeight: designOption.id === 'brutalist' ? 800 : 500,
                            textTransform: designOption.id === 'brutalist' ? 'uppercase' : 'none',
                            letterSpacing: designOption.id === 'brutalist' ? '0.05em' : 'normal',
                            boxShadow: designOption.id === 'neon' ? '0 0 8px hsl(var(--primary) / 0.4)' : 'none',
                          } as React.CSSProperties}
                        >
                          Button
                        </div>
                        <div 
                          className="px-3 py-1 text-xs bg-muted text-muted-foreground"
                          style={{ 
                            borderRadius: designOption.id === 'rounded' ? '12px' : designOption.id === 'sharp' || designOption.id === 'brutalist' || designOption.id === 'retro' ? '0' : '6px',
                            fontFamily: designOption.previewStyle.font || 'inherit',
                          }}
                        >
                          Secondary
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

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
