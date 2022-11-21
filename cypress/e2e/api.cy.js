describe("Visitor Count API", () => {
  it("POSTs an update to a page", () => {
    cy.request({
      method: "POST",
      url: "/page?page=test",
    }).should((response) => {
      cy.log(JSON.stringify(response.body));
      expect(response.status).to.eq(200);
      expect(response.body.Action).to.eq("Increment");
      expect(response.body.Status).to.eq("Success");
      expect(response.body.Page).to.eq("test");
    });
  });

  it("GETs the current count for a page", () => {
    cy.request({
      method: "GET",
      url: "/page?page=test",
    }).should((response) => {
      cy.log(JSON.stringify(response.body));
      expect(response.status).to.eq(200);
      assert.isNumber(response.body);
    });
  });

  it("GETs a list of all pages", () => {
    cy.request("/pages").should((response) => {
      cy.log(JSON.stringify(response.body));
      expect(response.status).to.eq(200);
      expect(response.body.length).to.be.greaterThan(0);
      expect(response.body[0]).to.have.all.keys("page", "hits");
      assert.isArray(response.body, "pages response is an array");
    });
  });
});
