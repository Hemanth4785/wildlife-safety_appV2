import React from 'react';
import { ThemedText } from '../src/components/themed-text';
import { ThemedView } from '../src/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center p-6">
      <ThemedText type="title">Wildlife Safety Modal</ThemedText>
      <p className="mt-4 text-slate-600 dark:text-slate-300 text-center max-w-md">
        This screen was originally structured for Expo Router. In standard production, navigation routes are wrapped with Expo Router or React Navigation.
      </p>
      <a href="/" className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition">
        Return to Home
      </a>
    </ThemedView>
  );
}
