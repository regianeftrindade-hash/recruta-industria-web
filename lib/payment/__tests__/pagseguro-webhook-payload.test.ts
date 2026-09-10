import { describe, expect, it } from "vitest";
import {
  extractGatewayReference,
  extractGatewayStatus,
} from "@/lib/payment/pagseguro-client";

describe("webhook PagBank — payload", () => {
  it("lê reference_id no topo", () => {
    expect(
      extractGatewayReference({ reference_id: "ordem-local-1", status: "PAID" }),
    ).toBe("ordem-local-1");
  });

  it("aceita id ORDE_/CHAR_ e charges[0].id", () => {
    expect(extractGatewayReference({ id: "ORDE_abc" })).toBe("ORDE_abc");
    expect(extractGatewayReference({ id: "CHAR_xyz" })).toBe("CHAR_xyz");
    expect(
      extractGatewayReference({
        id: "evt_1",
        charges: [{ id: "CHAR_from_charge", status: "PAID" }],
      }),
    ).toBe("CHAR_from_charge");
  });

  it("desce para payload.data aninhado", () => {
    expect(
      extractGatewayReference({
        data: { reference_id: "ref-nested", status: "WAITING" },
      }),
    ).toBe("ref-nested");
  });

  it("status vem do topo ou de charges[0]", () => {
    expect(extractGatewayStatus({ status: "PAID" })).toBe("PAID");
    expect(
      extractGatewayStatus({
        charges: [{ id: "CHAR_1", status: "CANCELED" }],
      }),
    ).toBe("CANCELED");
    expect(
      extractGatewayStatus({
        data: { status: "WAITING" },
      }),
    ).toBe("WAITING");
  });
});
