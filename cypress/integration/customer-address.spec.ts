import { internet } from "faker"

import { euAddress, euAddress2 } from "../support/utils"

describe("Checkout customer address", () => {
  const filename = "customer-addresses"
  const redirectUrl = internet.url()

  const email = internet.email().toLocaleLowerCase()
  const password = internet.password()

  before(function () {
    cy.createCustomer({ email: email, password: password }).then(() => {
      cy.getTokenCustomer({
        username: email,
        password: password,
      }).as("tokenObj")
    })
  })

  context("initial order empty", () => {
    before(function () {
      cy.createOrder("draft", {
        languageCode: "en",
        customerEmail: email,
        accessToken: this.tokenObj.access_token,
      })
        .as("newOrder")
        .then((order) => {
          cy.createSkuLineItems({
            orderId: order.id,
            accessToken: this.tokenObj.access_token,
          })
        })
    })

    beforeEach(function () {
      cy.setRoutes({
        endpoint: Cypress.env("apiEndpoint"),
        routes: Cypress.env("requests"),
        record: Cypress.env("record"), // @default false
        filename,
      })
    })

    after(() => {
      if (Cypress.env("record")) {
        cy.saveRequests(filename)
      }
    })

    it("valid customer token", function () {
      cy.visit(
        `/?accessToken=${this.tokenObj.access_token}&orderId=${this.newOrder.id}&redirectUrl=${redirectUrl}`
      )
      cy.wait(["@getOrders", "@retrieveLineItems"])
      cy.url().should("contain", this.tokenObj.access_token)
      cy.url().should("not.contain", Cypress.env("accessToken"))
    })

    it("fill billing form", () => {
      cy.dataCy("input_billing_address_first_name").type(euAddress.first_name)
      cy.dataCy("input_billing_address_last_name").type(euAddress.last_name)
      cy.dataCy("input_billing_address_line_1").type(euAddress.line_1)
      cy.dataCy("input_billing_address_city").type(euAddress.city)
      cy.dataCy("input_billing_address_country_code").select(
        euAddress.country_code
      )
      cy.dataCy("input_billing_address_state_code").type(euAddress.state_code)
      cy.dataCy("input_billing_address_zip_code").type(euAddress.zip_code)
      cy.dataCy("input_billing_address_phone").type(euAddress.phone)
    })

    it("save form", () => {
      cy.dataCy("save-addresses-button").click()
      cy.wait([
        "@createAddress",
        "@updateOrder",
        "@getOrders",
        "@retrieveLineItems",
      ])
      cy.dataCy("full_address_billing")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)

      cy.dataCy("full_address_shipping")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)
    })

    it("click to customer tab", () => {
      cy.dataCy("step_customer").click()
      cy.dataCy("input_billing_address_first_name").should(
        "contain.value",
        euAddress.first_name
      ) // da non usare ma usare .should("have.attr" subito dopo click()
    })

    it("ship to different address", () => {
      cy.dataCy("button-ship-to-different-address")
        .click()
        .should("have.attr", "data-status", "true")
    })

    it("fill shipping form", () => {
      cy.dataCy("input_shipping_address_first_name").type(euAddress2.first_name)
      cy.dataCy("input_shipping_address_last_name").type(euAddress2.last_name)
      cy.dataCy("input_shipping_address_line_1").type(euAddress2.line_1)
      cy.dataCy("input_shipping_address_city").type(euAddress2.city)
      cy.dataCy("input_shipping_address_country_code").select(
        euAddress2.country_code
      )
      cy.dataCy("input_shipping_address_state_code").type(euAddress2.state_code)
      cy.dataCy("input_shipping_address_zip_code").type(euAddress2.zip_code)
      cy.dataCy("input_shipping_address_phone").type(euAddress2.phone)
    })

    it("save form", () => {
      cy.dataCy("save-addresses-button").click()
      cy.wait([
        "@createAddress",
        "@updateOrder",
        "@getOrders",
        "@retrieveLineItems",
      ])
      cy.dataCy("full_address_billing")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)

      cy.dataCy("full_address_shipping")
        .should("contain", euAddress2.line_1)
        .and("contain", euAddress2.phone)
        .and("contain", euAddress2.city)
        .and("contain", euAddress2.zip_code)
        .and("contain", euAddress2.state_code)
    })
  })

  context("initial order with same address", () => {
    before(function () {
      cy.getTokenCustomer({
        username: email,
        password: password,
      })
        .as("tokenObj")
        .then((tokenObj) => {
          cy.createOrder("draft", {
            languageCode: "en",
            customerEmail: email,
            accessToken: tokenObj.access_token,
          })
            .as("newOrder")
            .then((order) => {
              cy.createSkuLineItems({
                orderId: order.id,
                accessToken: tokenObj.access_token,
              })
              cy.createAddress({
                firstName: euAddress.first_name,
                lastName: euAddress.last_name,
                city: euAddress.city,
                countryCode: euAddress.country_code,
                line1: euAddress.line_1,
                phone: euAddress.phone,
                stateCode: euAddress.state_code,
                zipCode: euAddress.zip_code,
                accessToken: tokenObj.access_token,
              }).then((address) => {
                cy.setSameAddress(order.id, address.id, tokenObj.access_token)
              })
            })
        })
    })

    beforeEach(function () {
      cy.setRoutes({
        endpoint: Cypress.env("apiEndpoint"),
        routes: Cypress.env("requests"),
        record: Cypress.env("record"), // @default false
        filename,
      })
    })

    after(() => {
      if (Cypress.env("record")) {
        cy.saveRequests(filename)
      }
    })

    it("valid customer token", function () {
      cy.visit(
        `/?accessToken=${this.tokenObj.access_token}&orderId=${this.newOrder.id}&redirectUrl=${redirectUrl}`
      )
      cy.wait(["@getOrders", "@retrieveLineItems"])
      cy.url().should("contain", this.tokenObj.access_token)
      cy.url().should("not.contain", Cypress.env("accessToken"))
    })

    it("check information", function () {
      cy.dataCy("full_address_billing")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)

      cy.dataCy("full_address_shipping")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)
    })
  })

  context("initial order with differend address", () => {
    before(function () {
      cy.getTokenCustomer({
        username: email,
        password: password,
      })
        .as("tokenObj")
        .then((tokenObj) => {
          cy.createOrder("draft", {
            languageCode: "en",
            customerEmail: email,
            accessToken: tokenObj.access_token,
          })
            .as("newOrder")
            .then((order) => {
              cy.createSkuLineItems({
                orderId: order.id,
                accessToken: tokenObj.access_token,
              })
              cy.createAddress({
                orderId: order.id,
                firstName: euAddress.first_name,
                lastName: euAddress.last_name,
                city: euAddress.city,
                countryCode: euAddress.country_code,
                line1: euAddress.line_1,
                phone: euAddress.phone,
                stateCode: euAddress.state_code,
                zipCode: euAddress.zip_code,
                accessToken: tokenObj.access_token,
              }).then((billingAddress) => {
                cy.createAddress({
                  orderId: order.id,
                  firstName: euAddress2.first_name,
                  lastName: euAddress2.last_name,
                  city: euAddress2.city,
                  countryCode: euAddress2.country_code,
                  line1: euAddress2.line_1,
                  phone: euAddress2.phone,
                  stateCode: euAddress2.state_code,
                  zipCode: euAddress2.zip_code,
                  accessToken: tokenObj.access_token,
                }).then((shippingAddress) => {
                  cy.setDifferentAddress(
                    order.id,
                    billingAddress.id,
                    shippingAddress.id,
                    tokenObj.access_token
                  )
                })
              })
            })
        })
    })

    beforeEach(function () {
      cy.setRoutes({
        endpoint: Cypress.env("apiEndpoint"),
        routes: Cypress.env("requests"),
        record: Cypress.env("record"), // @default false
        filename,
      })
    })

    after(() => {
      if (Cypress.env("record")) {
        cy.saveRequests(filename)
      }
    })

    it("valid customer token", function () {
      cy.visit(
        `/?accessToken=${this.tokenObj.access_token}&orderId=${this.newOrder.id}&redirectUrl=${redirectUrl}`
      )
      cy.wait(["@getOrders", "@retrieveLineItems"])
      cy.url().should("contain", this.tokenObj.access_token)
      cy.url().should("not.contain", Cypress.env("accessToken"))
    })

    it("check information", function () {
      cy.dataCy("full_address_billing")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)

      cy.dataCy("full_address_shipping")
        .should("contain", euAddress2.line_1)
        .and("contain", euAddress2.phone)
        .and("contain", euAddress2.city)
        .and("contain", euAddress2.zip_code)
        .and("contain", euAddress2.state_code)
    })
  })

  context.only("initial order empty with one address on book", () => {
    before(function () {
      cy.getTokenCustomer({
        username: email,
        password: password,
      })
        .as("tokenObj")
        .then((tokenObj) => {
          cy.createAddress({
            firstName: euAddress.first_name,
            lastName: euAddress.last_name,
            city: euAddress.city,
            countryCode: euAddress.country_code,
            line1: euAddress.line_1,
            phone: euAddress.phone,
            stateCode: euAddress.state_code,
            zipCode: euAddress.zip_code,
            accessToken: tokenObj.access_token,
          }).then((address) => {
            cy.addAddressToBook(address.id, tokenObj.access_token).then(() => {
              cy.createOrder("draft", {
                languageCode: "en",
                customerEmail: email,
                accessToken: tokenObj.access_token,
              })
                .as("newOrder")
                .then((order) => {
                  cy.createSkuLineItems({
                    orderId: order.id,
                    accessToken: tokenObj.access_token,
                  })
                })
            })
          })
        })
    })

    beforeEach(function () {
      cy.setRoutes({
        endpoint: Cypress.env("apiEndpoint"),
        routes: Cypress.env("requests"),
        record: Cypress.env("record"), // @default false
        filename,
      })
    })

    after(() => {
      if (Cypress.env("record")) {
        cy.saveRequests(filename)
      }
    })

    it("valid customer token", function () {
      cy.visit(
        `/?accessToken=${this.tokenObj.access_token}&orderId=${this.newOrder.id}&redirectUrl=${redirectUrl}`
      )
      cy.url().should("contain", this.tokenObj.access_token)
      cy.url().should("not.contain", Cypress.env("accessToken"))
    })

    it("check information", () => {
      cy.wait(["@getOrders", "@retrieveLineItems"])
      cy.reload()
      cy.wait(["@getOrders", "@retrieveLineItems"])

      cy.dataCy("full_address_billing")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)

      cy.dataCy("full_address_shipping")
        .should("contain", euAddress.line_1)
        .and("contain", euAddress.phone)
        .and("contain", euAddress.city)
        .and("contain", euAddress.zip_code)
        .and("contain", euAddress.state_code)
    })
  })
})
