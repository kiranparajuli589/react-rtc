"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import RecorderErrorFallback from "./RecorderErrorFallback";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class RecorderErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RecorderErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <RecorderErrorFallback />;
    }

    return this.props.children;
  }
}
