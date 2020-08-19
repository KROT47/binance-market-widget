/// <reference types="cypress" />

import { url } from "../../src/api/fetchProducts";

const WS_data = [
  {
    e: "24hrMiniTicker",
    E: 1597823528639,
    s: "BNBBTC",
    c: "0.00191330",
    o: "0.00191390",
    h: "0.00194110",
    l: "0.00188420",
    v: "1262638.25000000",
    q: "2417.61589969",
  },
  {
    e: "24hrMiniTicker",
    E: 1597823528439,
    s: "NEOBTC",
    c: "0.00136200",
    o: "0.00136800",
    h: "0.00138000",
    l: "0.00133400",
    v: "310505.83000000",
    q: "420.19866739",
  },
];

const pairsOrder = [
  "BNB/BTC",
  "ETC/BTC",
  "IOTA/BTC",
  "KNC/BTC",
  "LINK/BTC",
  "NEO/BTC",
  "NULS/BTC",
];

const start = (withWS = false) => {
  cy.server();
  cy.route(url, "fixture:products.json").as("products");

  cy.visit("/", {
    onBeforeLoad(win) {
      cy.stub(win, "WebSocket", (url) => null);

      if (withWS) {
        setTimeout(() => {
          win.EventEmitter.emit("WS_MESSAGE", { data: WS_data });
        }, 2000);
      }
    },
  });

  cy.wait("@products");
};

context("Market widget", () => {
  it("should update data on websocket message", () => {
    start(true);

    cy.getByTestId("pair-cell").eq(0).should("contain", "BNB/BTC");
    cy.getByTestId("last-price-cell").eq(0).should("contain", "0.0019287");
    cy.getByTestId("change-cell").eq(0).should("contain", "-0.11");

    cy.getByTestId("last-price-cell").eq(0).should("contain", "0.00191330");
    cy.getByTestId("change-cell").eq(0).should("contain", "0.03");
    cy.getByTestId("pair-cell").eq(0).should("contain", "BNB/BTC");
  });

  it("should update rows order on table header click", () => {
    start();

    cy.getByTestId("pair-cell").then((x) => {
      x.each((i, x) => {
        cy.wrap(x).should("contain", pairsOrder[i]);
      });
    });

    cy.getByTestId("header-pair").click();

    cy.getByTestId("pair-cell").then((x) => {
      const reversedPairsOrder = pairsOrder.reverse();
      x.each((i, x) => {
        cy.wrap(x).should("contain", reversedPairsOrder[i]);
      });
    });
  });
});
