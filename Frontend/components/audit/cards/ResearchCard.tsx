"use client";

import { Badge } from "@/components/ui/badge";

interface Props {
  data: any;
}

export default function ResearchCard({ data }: Props) {
  if (!data) return null;

  return (
    <div className="space-y-5">

      {/* Tools */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Tools Used</h4>

        <div className="flex flex-wrap gap-2">
          {(data.tool_used || []).map((tool: string) => (
            <Badge key={tool} variant="outline">
              {tool}
            </Badge>
          ))}
        </div>
      </div>

      {/* Queries */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Queries</h4>

        <ul className="list-disc space-y-1 pl-5 text-sm text-white/70">
          {(data.queries || []).map((query: string, index: number) => (
            <li key={index}>{query}</li>
          ))}
        </ul>
      </div>

      {/* Sources */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Sources</h4>

        <div className="space-y-2">
          {(data.sources || []).map((source: any, index: number) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 p-3"
            >
              <p className="font-medium">
                {source.title}
              </p>

              <p className="mt-1 text-xs text-white/50">
                {source.url}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence */}
      {data.evidence && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">
            Evidence
          </h4>

          <div className="rounded-lg bg-white/[0.03] p-3 text-sm leading-6 text-white/70">
            {data.evidence}
          </div>
        </div>
      )}

    </div>
  );
}