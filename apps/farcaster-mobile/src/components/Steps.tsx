import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { AnalyticsEventData } from '~/constants/AnalyticsEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export type StepOptions = {
  label: string;
  description?: string;

  /** Enable analytics by providing key unique to a set of steps */
  analyticsKey?: string;
};

type StepsProps = {
  steps: StepOptions[];
  currentIndex: number;

  /** Enable analytics by providing a globably unique key */
  analyticsKey?: string;

  /** Additional properties to include on events—should be memoized */
  analyticsProps?: AnalyticsEventData;
};

export function Steps({
  steps,
  currentIndex,
  analyticsKey,
  analyticsProps,
}: StepsProps) {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const currentStepLabel = steps[currentIndex]?.label;
  const currentStepKey = steps[currentIndex]?.analyticsKey;
  const isComplete = currentIndex === steps.length - 1;

  useEffect(() => {
    if (analyticsKey) {
      if (currentStepLabel) {
        trackEvent(`view ${analyticsKey} step` as AnalyticsEvent, {
          stepsKey: analyticsKey,
          stepKey: currentStepKey,
          ...analyticsProps,
        });
      } else if (isComplete) {
        trackEvent(`view ${analyticsKey} step` as AnalyticsEvent, {
          stepsKey: analyticsKey,
          stepKey: 'finish',
          ...analyticsProps,
        });
      }
    }
  }, [
    analyticsKey,
    currentIndex,
    trackEvent,
    currentStepLabel,
    currentStepKey,
    isComplete,
    analyticsProps,
  ]);

  return (
    <View style={[t.flexGrow, t.flexCol, t.justifyAround]}>
      {steps.map((step, index) => (
        <Step
          key={index}
          isComplete={index < currentIndex}
          isCurrent={index === currentIndex}
          label={step.label}
          description={step.description}
        />
      ))}
    </View>
  );
}

type StepProps = {
  isComplete: boolean;
  isCurrent: boolean;
  label: string;
  description?: string;
};

function Step({ isComplete, isCurrent, label, description }: StepProps) {
  const t = useTheme();

  const textStyles = useMemo(() => {
    if (isComplete) {
      return [t.texts.success, t.fontSemibold];
    } else {
      return [t.texts.primary, t.fontSemibold];
    }
  }, [isComplete, t]);

  const icon = useMemo(() => {
    if (isComplete) {
      return (
        <Octicons name="check-circle" size={36} color={t.colors.text.success} />
      );
    } else if (isCurrent) {
      return <Octicons name="circle" size={36} color={t.colors.text.primary} />;
    } else {
      return <Octicons name="circle" size={36} color={t.colors.text.primary} />;
    }
  }, [isCurrent, isComplete, t]);

  return (
    <View style={[t.flexRow, t.pX4, t.pY1]}>
      <View style={[t.mR4, { width: 36, height: 36 }]}>{icon}</View>
      <View style={[t.flexShrink, { marginTop: 6 }]}>
        <Text style={[t.textXl, t.fontNormal, textStyles]}>{label}</Text>
        <Text style={[t.textSm, t.fontNormal, t.texts.secondary, t.mT2]}>
          {description}
        </Text>
      </View>
    </View>
  );
}
