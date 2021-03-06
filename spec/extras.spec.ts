import getAjvAllInstances from "./ajv_all_instances"
import {withPack} from "./ajv_instances"
import {_} from ".."
import jsonSchemaTest = require("json-schema-test")
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"

const instances = getAjvAllInstances(options, {
  $data: true,
  formats: {allowedUnknown: true},
  strictTypes: false,
  strictTuples: false,
})

instances.forEach((ajv) => {
  ajv.opts.code.source = true
  ajv.opts.code.formats = _`{allowedUnknown: true}`
})

jsonSchemaTest(withPack(instances), {
  description:
    "Extra keywords schemas tests of " + instances.length + " ajv instances with different options",
  suites: {extras: require("./_json/extras")},
  assert: require("./chai").assert,
  afterError,
  afterEach,
  cwd: __dirname,
  hideFolder: "extras/",
  timeout: 90000,
})
