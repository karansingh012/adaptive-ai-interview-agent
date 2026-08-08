import * as React from "react";
import { Button as UiButton } from "@/components/ui/button";

export type ButtonProps = React.ComponentPropsWithoutRef<typeof UiButton>;

export function Button(props: ButtonProps) {
  return <UiButton {...props} />;
}
