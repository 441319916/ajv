import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #240, mutually recursive fragment refs reference a common schema", () => {
  const apiSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "schema://api.schema#",
    $defs: {
      resource: {
        $id: "#resource",
        type: "object",
        properties: {
          id: {type: "string"},
        },
      },
      resourceIdentifier: {
        $id: "#resource_identifier",
        type: "object",
        properties: {
          id: {type: "string"},
          type: {type: "string"},
        },
      },
    },
  }

  const domainSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "schema://domain.schema#",
    type: "object",
    properties: {
      data: {
        oneOf: [
          {$ref: "schema://library.schema#resource_identifier"},
          {$ref: "schema://catalog_item.schema#resource_identifier"},
        ],
      },
    },
  }

  it("should compile and validate schema when one ref is fragment", () => {
    const ajv = new _Ajv()

    const librarySchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "schema://library.schema#",
      type: "object",
      properties: {
        name: {type: "string"},
        links: {
          type: "object",
          properties: {
            catalogItems: {
              type: "array",
              items: {
                $ref: "schema://catalog_item_resource_identifier.schema#",
              },
            },
          },
        },
      },
      definitions: {
        resource_identifier: {
          $id: "#resource_identifier",
          allOf: [
            {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["Library"],
                },
              },
            },
            {$ref: "schema://api.schema#resource_identifier"},
          ],
        },
      },
    }

    const catalogItemSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "schema://catalog_item.schema#",
      type: "object",
      properties: {
        name: {type: "string"},
        links: {
          type: "object",
          properties: {
            library: {$ref: "schema://library.schema#resource_identifier"},
          },
        },
      },
      definitions: {
        resource_identifier: {
          $id: "#resource_identifier",
          allOf: [
            {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["CatalogItem"],
                },
              },
            },
            {$ref: "schema://api.schema#resource_identifier"},
          ],
        },
      },
    }

    const catalogItemResourceIdentifierSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "schema://catalog_item_resource_identifier.schema#",
      allOf: [
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["CatalogItem"],
            },
          },
        },
        {
          $ref: "schema://api.schema#resource_identifier",
        },
      ],
    }

    ajv.addSchema(librarySchema)
    ajv.addSchema(catalogItemSchema)
    ajv.addSchema(catalogItemResourceIdentifierSchema)
    ajv.addSchema(apiSchema)

    const validate = ajv.compile(domainSchema)
    testSchema(validate)
  })

  it("should compile and validate schema when both refs are fragments", () => {
    const ajv = new _Ajv()

    const librarySchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "schema://library.schema#",
      type: "object",
      properties: {
        name: {type: "string"},
        links: {
          type: "object",
          properties: {
            catalogItems: {
              type: "array",
              items: {$ref: "schema://catalog_item.schema#resource_identifier"},
            },
          },
        },
      },
      definitions: {
        resource_identifier: {
          $id: "#resource_identifier",
          allOf: [
            {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["Library"],
                },
              },
            },
            {$ref: "schema://api.schema#resource_identifier"},
          ],
        },
      },
    }

    const catalogItemSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "schema://catalog_item.schema#",
      type: "object",
      properties: {
        name: {type: "string"},
        links: {
          type: "object",
          properties: {
            library: {$ref: "schema://library.schema#resource_identifier"},
          },
        },
      },
      definitions: {
        resource_identifier: {
          $id: "#resource_identifier",
          allOf: [
            {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["CatalogItem"],
                },
              },
            },
            {$ref: "schema://api.schema#resource_identifier"},
          ],
        },
      },
    }

    ajv.addSchema(librarySchema)
    ajv.addSchema(catalogItemSchema)
    ajv.addSchema(apiSchema)

    const validate = ajv.compile(domainSchema)
    testSchema(validate)
  })

  function testSchema(validate) {
    validate({data: {type: "Library", id: "123"}}).should.equal(true)
    validate({data: {type: "Library", id: 123}}).should.equal(false)
    validate({data: {type: "CatalogItem", id: "123"}}).should.equal(true)
    validate({data: {type: "CatalogItem", id: 123}}).should.equal(false)
    validate({data: {type: "Foo", id: "123"}}).should.equal(false)
  }
})
