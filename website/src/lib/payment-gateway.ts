export type GatewayRedirect = {
  method: "GET" | "POST";
  url: string;
  fields: Record<string, string>;
};

export function submitGatewayRedirect(redirect: GatewayRedirect): void {
  const form = document.createElement("form");
  form.method = redirect.method;
  form.action = redirect.url;
  for (const [name, value] of Object.entries(redirect.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function paymentRedirectUrl(apiUrl: string, sessionId: string): string {
  return `${apiUrl.replace(/\/$/, "")}/payments/redirect/${sessionId}`;
}
