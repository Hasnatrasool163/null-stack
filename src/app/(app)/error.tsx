"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <Card role="alert" className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          We could not load this page. Please try again.
        </p>
        <Button onClick={() => retry()}>Try again</Button>
      </CardContent>
    </Card>
  );
}
