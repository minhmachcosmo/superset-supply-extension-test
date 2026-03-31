// Type stubs for Superset peer dependencies.
// These packages are provided by the host Superset environment at runtime.
// The stubs allow standalone TypeScript compilation without installing the full packages.

declare module '@superset-ui/core' {
  export function t(str: string): string;
  export function validateNonEmpty(value: unknown): string | false;
  export interface SupersetClientError {
    error?: string;
    message?: string;
    statusText?: string;
    status?: number;
    errors?: Array<Record<string, unknown>>;
    link?: string;
  }
  export const SupersetClient: {
    post(opts: {
      endpoint: string;
      body?: string;
      headers?: Record<string, string>;
      parseMethod?: string;
      jsonPayload?: Record<string, unknown>;
    }): Promise<{ json: Record<string, unknown> }>;
  };
  export function getClientErrorObject(
    error: Response | SupersetClientError | Record<string, unknown>,
  ): Promise<SupersetClientError>;
  export class ChartMetadata {
    constructor(opts: Record<string, unknown>);
  }
  export class ChartPlugin {
    constructor(opts: Record<string, unknown>);
    configure(opts: Record<string, unknown>): this;
  }
  export class ChartProps {
    width: number;
    height: number;
    formData: Record<string, unknown>;
    queriesData: Array<{ data: unknown[] }>;
    constructor(opts: Record<string, unknown>);
  }
  export const supersetTheme: Record<string, unknown>;
  export function buildQueryContext(
    formData: QueryFormData,
    fn: (base: Record<string, unknown>) => Record<string, unknown>[],
  ): { queries: Record<string, unknown>[] };
  export type QueryFormData = Record<string, unknown>;
}

declare module '@superset-ui/chart-controls' {
  export type ControlPanelConfig = Record<string, unknown>;
  export const sharedControls: Record<string, unknown>;
}
