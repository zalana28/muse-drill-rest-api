/** Error carrying an HTTP status code. The error handler in app.ts renders it as JSON. */
export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
