const fs = require('fs');
const path = require('path');

const autoAuthPreRequest = [
  'if (!pm.environment.get("adminToken") || !pm.environment.get("userId")) {',
  '  pm.sendRequest({',
  '    url: pm.environment.get("baseUrl") + "/auth/login",',
  '    method: "POST",',
  '    header: { "Content-Type": "application/json" },',
  '    body: { mode: "raw", raw: JSON.stringify({ email: "admin@example.com", password: "Password123!" }) }',
  '  }, function (err, res) {',
  '    if (res && res.code === 200) {',
  '      var data = res.json();',
  '      pm.environment.set("adminToken", data.token);',
  '      pm.environment.set("token", data.token);',
  '      pm.environment.set("userId", data.user.id);',
  '    }',
  '  });',
  '}',
  'if (!pm.environment.get("itemId") || !pm.environment.get("locationId")) {',
  '  pm.sendRequest({',
  '    url: pm.environment.get("baseUrl") + "/inventory",',
  '    method: "GET",',
  '    header: { "Authorization": "Bearer " + (pm.environment.get("adminToken") || "") }',
  '  }, function (err, res) {',
  '    if (res && res.code === 200) {',
  '      var data = res.json();',
  '      if (data.length > 0) {',
  '        pm.environment.set("inventoryId", data[0].id);',
  '        pm.environment.set("itemId", data[0].itemId);',
  '        pm.environment.set("locationId", data[0].locationId);',
  '        pm.environment.set("blrLocationId", data[0].locationId);',
  '        var otherLoc = data.find(function(i) { return i.locationId !== data[0].locationId; });',
  '        if (otherLoc) {',
  '          pm.environment.set("maaLocationId", otherLoc.locationId);',
  '          pm.environment.set("sourceLocationId", otherLoc.locationId);',
  '          pm.environment.set("destinationLocationId", data[0].locationId);',
  '        }',
  '      }',
  '    }',
  '  });',
  '}'
];

const autoOpsPreRequest = [
  'if (!pm.environment.get("operationsToken")) {',
  '  pm.sendRequest({',
  '    url: pm.environment.get("baseUrl") + "/auth/login",',
  '    method: "POST",',
  '    header: { "Content-Type": "application/json" },',
  '    body: { mode: "raw", raw: JSON.stringify({ email: "operations@example.com", password: "Password123!" }) }',
  '  }, function (err, res) {',
  '    if (res && res.code === 200) {',
  '      var data = res.json();',
  '      pm.environment.set("operationsToken", data.token);',
  '      pm.environment.set("opsUserId", data.user.id);',
  '    }',
  '  });',
  '}'
];

const autoSalesPreRequest = [
  'if (!pm.environment.get("salesToken")) {',
  '  pm.sendRequest({',
  '    url: pm.environment.get("baseUrl") + "/auth/login",',
  '    method: "POST",',
  '    header: { "Content-Type": "application/json" },',
  '    body: { mode: "raw", raw: JSON.stringify({ email: "sales@example.com", password: "Password123!" }) }',
  '  }, function (err, res) {',
  '    if (res && res.code === 200) {',
  '      var data = res.json();',
  '      pm.environment.set("salesToken", data.token);',
  '      pm.environment.set("salesUserId", data.user.id);',
  '    }',
  '  });',
  '}'
];

const collection = {
  info: {
    name: 'Mini Operations ERP',
    description: 'Complete Postman API Collection with automated tests, negative tests, role-based auth, and full business flow.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: [
    {
      name: 'Authentication',
      item: [
        {
          name: 'Login Admin',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'admin@example.com', password: 'Password123!' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'var jsonData = pm.response.json();',
                  'pm.test("Token received", function () { pm.expect(jsonData.token).to.be.a("string"); });',
                  'pm.environment.set("adminToken", jsonData.token);',
                  'pm.environment.set("token", jsonData.token);',
                  'pm.environment.set("userId", jsonData.user.id);'
                ]
              }
            }
          ]
        },
        {
          name: 'Login Operations',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'operations@example.com', password: 'Password123!' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'var jsonData = pm.response.json();',
                  'pm.test("Operations token received", function () { pm.expect(jsonData.token).to.be.a("string"); });',
                  'pm.environment.set("operationsToken", jsonData.token);',
                  'pm.environment.set("opsUserId", jsonData.user.id);'
                ]
              }
            }
          ]
        },
        {
          name: 'Login Sales',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'sales@example.com', password: 'Password123!' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'var jsonData = pm.response.json();',
                  'pm.test("Sales token received", function () { pm.expect(jsonData.token).to.be.a("string"); });',
                  'pm.environment.set("salesToken", jsonData.token);',
                  'pm.environment.set("salesUserId", jsonData.user.id);'
                ]
              }
            }
          ]
        },
        {
          name: 'Get Current User',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'var jsonData = pm.response.json();',
                  'pm.test("User object returned", function () { pm.expect(jsonData.email).to.eql("admin@example.com"); });'
                ]
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/auth/me', host: ['{{baseUrl}}'], path: ['auth', 'me'] }
          }
        }
      ]
    },
    {
      name: 'Inventory',
      item: [
        {
          name: 'Get All Inventory',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'var jsonData = pm.response.json();',
                  'pm.test("Inventory array returned", function () { pm.expect(jsonData).to.be.an("array"); });',
                  'if (jsonData.length > 0) {',
                  '  pm.environment.set("inventoryId", jsonData[0].id);',
                  '  pm.environment.set("itemId", jsonData[0].itemId);',
                  '  pm.environment.set("locationId", jsonData[0].locationId);',
                  '  pm.environment.set("blrLocationId", jsonData[0].locationId);',
                  '  var otherLoc = jsonData.find(function(i) { return i.locationId !== jsonData[0].locationId; });',
                  '  if (otherLoc) {',
                  '    pm.environment.set("maaLocationId", otherLoc.locationId);',
                  '    pm.environment.set("sourceLocationId", otherLoc.locationId);',
                  '    pm.environment.set("destinationLocationId", jsonData[0].locationId);',
                  '  }',
                  '}'
                ]
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/inventory', host: ['{{baseUrl}}'], path: ['inventory'] }
          }
        },
        {
          name: 'Get Single Inventory Item',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'
                ]
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/inventory/{{inventoryId}}', host: ['{{baseUrl}}'], path: ['inventory', '{{inventoryId}}'] }
          }
        },
        {
          name: 'Adjust Stock',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                itemId: '{{itemId}}',
                locationId: '{{locationId}}',
                quantity: 15,
                reason: 'Postman manual stock intake'
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/inventory/adjust', host: ['{{baseUrl}}'], path: ['inventory', 'adjust'] }
          }
        },
        {
          name: 'Get Inventory Transactions',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'
                ]
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/inventory/{{inventoryId}}/transactions', host: ['{{baseUrl}}'], path: ['inventory', '{{inventoryId}}', 'transactions'] }
          }
        }
      ]
    },
    {
      name: 'Work Orders',
      item: [
        {
          name: 'List Work Orders',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/work-orders', host: ['{{baseUrl}}'], path: ['work-orders'] }
          }
        },
        {
          name: 'Create Work Order',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201 Created", function () { pm.response.to.have.status(201); });',
                  'var jsonData = pm.response.json();',
                  'pm.environment.set("workOrderId", jsonData.id);'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                locationId: '{{locationId}}',
                itemId: '{{itemId}}',
                requiredQuantity: 50,
                assignedUserId: '{{userId}}'
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/work-orders', host: ['{{baseUrl}}'], path: ['work-orders'] }
          }
        },
        {
          name: 'Get Work Order by ID',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("workOrderId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/work-orders",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("adminToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ locationId: pm.environment.get("locationId"), itemId: pm.environment.get("itemId"), requiredQuantity: 10, assignedUserId: pm.environment.get("userId") }) }',
                  '  }, function (err, res) { if (res && res.code === 201) { pm.environment.set("workOrderId", res.json().id); } });',
                  '}'
                ]
              }
            },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/work-orders/{{workOrderId}}', host: ['{{baseUrl}}'], path: ['work-orders', '{{workOrderId}}'] }
          }
        },
        {
          name: 'Update Work Order Status',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("workOrderId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/work-orders",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("adminToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ locationId: pm.environment.get("locationId"), itemId: pm.environment.get("itemId"), requiredQuantity: 10, assignedUserId: pm.environment.get("userId") }) }',
                  '  }, function (err, res) { if (res && res.code === 201) { pm.environment.set("workOrderId", res.json().id); } });',
                  '}'
                ]
              }
            },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ status: 'IN_PROGRESS' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/work-orders/{{workOrderId}}/status', host: ['{{baseUrl}}'], path: ['work-orders', '{{workOrderId}}', 'status'] }
          }
        }
      ]
    },
    {
      name: 'Transfers',
      item: [
        {
          name: 'List Transfers',
          event: [
            { listen: 'prerequest', script: { exec: autoOpsPreRequest } },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{operationsToken}}' }],
            url: { raw: '{{baseUrl}}/transfers', host: ['{{baseUrl}}'], path: ['transfers'] }
          }
        },
        {
          name: 'Create Transfer',
          event: [
            { listen: 'prerequest', script: { exec: [...autoOpsPreRequest, ...autoAuthPreRequest] } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201 Created", function () { pm.response.to.have.status(201); });',
                  'var jsonData = pm.response.json();',
                  'pm.environment.set("transferId", jsonData.id);'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{operationsToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                sourceLocationId: '{{sourceLocationId}}',
                destinationLocationId: '{{destinationLocationId}}',
                itemId: '{{itemId}}',
                quantity: 10
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/transfers', host: ['{{baseUrl}}'], path: ['transfers'] }
          }
        },
        {
          name: 'Dispatch Transfer',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoOpsPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("transferId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/transfers",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("operationsToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ sourceLocationId: pm.environment.get("sourceLocationId"), destinationLocationId: pm.environment.get("destinationLocationId"), itemId: pm.environment.get("itemId"), quantity: 5 }) }',
                  '  }, function (err, res) { if (res && res.code === 201) { pm.environment.set("transferId", res.json().id); } });',
                  '}'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'pm.environment.set("dispatchedTransferId", pm.environment.get("transferId"));'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{operationsToken}}' }],
            url: { raw: '{{baseUrl}}/transfers/{{transferId}}/dispatch', host: ['{{baseUrl}}'], path: ['transfers', '{{transferId}}', 'dispatch'] }
          }
        },
        {
          name: 'Receive Transfer',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoOpsPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("dispatchedTransferId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/transfers",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("operationsToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ sourceLocationId: pm.environment.get("sourceLocationId"), destinationLocationId: pm.environment.get("destinationLocationId"), itemId: pm.environment.get("itemId"), quantity: 5 }) }',
                  '  }, function (err, res) {',
                  '    if (res && res.code === 201) {',
                  '      var tid = res.json().id;',
                  '      pm.environment.set("transferId", tid);',
                  '      pm.sendRequest({ url: pm.environment.get("baseUrl") + "/transfers/" + tid + "/dispatch", method: "POST", header: { "Authorization": "Bearer " + pm.environment.get("operationsToken") } }, function() { pm.environment.set("dispatchedTransferId", tid); });',
                  '    }',
                  '  });',
                  '}'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'pm.environment.set("receivedTransferId", pm.environment.get("transferId"));'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{operationsToken}}' }],
            url: { raw: '{{baseUrl}}/transfers/{{transferId}}/receive', host: ['{{baseUrl}}'], path: ['transfers', '{{transferId}}', 'receive'] }
          }
        }
      ]
    },
    {
      name: 'Customers',
      item: [
        {
          name: 'List Customers',
          event: [
            { listen: 'prerequest', script: { exec: autoSalesPreRequest } },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'var jsonData = pm.response.json();',
                  'if (jsonData.length > 0) { pm.environment.set("customerId", jsonData[0].id); }'
                ]
              }
            }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{salesToken}}' }],
            url: { raw: '{{baseUrl}}/customers', host: ['{{baseUrl}}'], path: ['customers'] }
          }
        },
        {
          name: 'Create Customer',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoSalesPreRequest,
                  'pm.environment.set("randomCustomerEmail", "customer." + Date.now() + "@example.com");'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201 Created", function () { pm.response.to.have.status(201); });',
                  'var jsonData = pm.response.json();',
                  'pm.environment.set("customerId", jsonData.id);'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Postman Test Customer',
                phone: '+91 9999999999',
                email: '{{randomCustomerEmail}}',
                companyName: 'Postman Global Corp'
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/customers', host: ['{{baseUrl}}'], path: ['customers'] }
          }
        }
      ]
    },
    {
      name: 'Customer Orders',
      item: [
        {
          name: 'List Customer Orders',
          event: [
            { listen: 'prerequest', script: { exec: autoSalesPreRequest } },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{salesToken}}' }],
            url: { raw: '{{baseUrl}}/orders', host: ['{{baseUrl}}'], path: ['orders'] }
          }
        },
        {
          name: 'Create Order',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoSalesPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("customerId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/customers",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("salesToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ name: "Auto Cust", phone: "+91 9999999999", email: "cust." + Date.now() + "@example.com", companyName: "Auto Corp" }) }',
                  '  }, function (err, res) { if (res && res.code === 201) { pm.environment.set("customerId", res.json().id); } });',
                  '}'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201 Created", function () { pm.response.to.have.status(201); });',
                  'var jsonData = pm.response.json();',
                  'pm.environment.set("orderId", jsonData.id);'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                customerId: '{{customerId}}',
                items: [
                  { itemId: '{{itemId}}', quantity: 5, unitPrice: 1200 }
                ]
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/orders', host: ['{{baseUrl}}'], path: ['orders'] }
          }
        },
        {
          name: 'Get Order by ID',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoSalesPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("orderId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/orders",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("salesToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ customerId: pm.environment.get("customerId"), items: [{ itemId: pm.environment.get("itemId"), quantity: 1, unitPrice: 1000 }] }) }',
                  '  }, function (err, res) { if (res && res.code === 201) { pm.environment.set("orderId", res.json().id); } });',
                  '}'
                ]
              }
            },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{salesToken}}' }],
            url: { raw: '{{baseUrl}}/orders/{{orderId}}', host: ['{{baseUrl}}'], path: ['orders', '{{orderId}}'] }
          }
        },
        {
          name: 'Reserve Stock',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoSalesPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("orderId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/orders",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("salesToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ customerId: pm.environment.get("customerId"), items: [{ itemId: pm.environment.get("itemId"), quantity: 1, unitPrice: 1000 }] }) }',
                  '  }, function (err, res) { if (res && res.code === 201) { pm.environment.set("orderId", res.json().id); } });',
                  '}'
                ]
              }
            },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ locationId: '{{locationId}}' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/orders/{{orderId}}/reserve', host: ['{{baseUrl}}'], path: ['orders', '{{orderId}}', 'reserve'] }
          }
        },
        {
          name: 'Cancel Order',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoSalesPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("orderId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/orders",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("salesToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ customerId: pm.environment.get("customerId"), items: [{ itemId: pm.environment.get("itemId"), quantity: 1, unitPrice: 1000 }] }) }',
                  '  }, function (err, res) { if (res && res.code === 201) { pm.environment.set("orderId", res.json().id); } });',
                  '}'
                ]
              }
            },
            { listen: 'test', script: { exec: ['pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'] } }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{salesToken}}' }],
            url: { raw: '{{baseUrl}}/orders/{{orderId}}/cancel', host: ['{{baseUrl}}'], path: ['orders', '{{orderId}}', 'cancel'] }
          }
        }
      ]
    },
    {
      name: 'Health',
      item: [
        {
          name: 'Health Check',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/health', host: ['{{baseUrl}}'], path: ['health'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'var jsonData = pm.response.json();',
                  'pm.test("Database connected", function () { pm.expect(jsonData.database).to.eql("CONNECTED"); });'
                ]
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Negative Tests',
      item: [
        {
          name: 'Attempt Over-Reservation (409 Conflict)',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoSalesPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("overReserveOrderId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/orders",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("salesToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ customerId: pm.environment.get("customerId"), items: [{ itemId: pm.environment.get("itemId"), quantity: 999999, unitPrice: 1000 }] }) }',
                  '  }, function (err, res) {',
                  '    if (res && res.code === 201) { pm.environment.set("overReserveOrderId", res.json().id); }',
                  '  });',
                  '}'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 409 Conflict", function () { pm.response.to.have.status(409); });'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ locationId: '{{locationId}}' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/orders/{{overReserveOrderId}}/reserve', host: ['{{baseUrl}}'], path: ['orders', '{{overReserveOrderId}}', 'reserve'] }
          }
        },
        {
          name: 'Attempt Transfer More Than Available (409 Conflict)',
          event: [
            { listen: 'prerequest', script: { exec: [...autoOpsPreRequest, ...autoAuthPreRequest] } },
            { listen: 'test', script: { exec: ['pm.test("Status code is 409 Conflict", function () { pm.response.to.have.status(409); });'] } }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{operationsToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                sourceLocationId: '{{sourceLocationId}}',
                destinationLocationId: '{{destinationLocationId}}',
                itemId: '{{itemId}}',
                quantity: 999999
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/transfers', host: ['{{baseUrl}}'], path: ['transfers'] }
          }
        },
        {
          name: 'Attempt Duplicate Dispatch (409 Conflict)',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoOpsPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("dispatchedTransferId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/transfers",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("operationsToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ sourceLocationId: pm.environment.get("sourceLocationId"), destinationLocationId: pm.environment.get("destinationLocationId"), itemId: pm.environment.get("itemId"), quantity: 5 }) }',
                  '  }, function (err, res) {',
                  '    if (res && res.code === 201) {',
                  '      var tid = res.json().id;',
                  '      pm.sendRequest({ url: pm.environment.get("baseUrl") + "/transfers/" + tid + "/dispatch", method: "POST", header: { "Authorization": "Bearer " + pm.environment.get("operationsToken") } }, function() { pm.environment.set("dispatchedTransferId", tid); });',
                  '    }',
                  '  });',
                  '}'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.test("Status code is 409 Conflict", function () { pm.response.to.have.status(409); });']
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{operationsToken}}' }],
            url: { raw: '{{baseUrl}}/transfers/{{dispatchedTransferId}}/dispatch', host: ['{{baseUrl}}'], path: ['transfers', '{{dispatchedTransferId}}', 'dispatch'] }
          }
        },
        {
          name: 'Attempt Duplicate Receive (409 Conflict)',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  ...autoOpsPreRequest,
                  ...autoAuthPreRequest,
                  'if (!pm.environment.get("receivedTransferId")) {',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/transfers",',
                  '    method: "POST",',
                  '    header: { "Content-Type": "application/json", "Authorization": "Bearer " + pm.environment.get("operationsToken") },',
                  '    body: { mode: "raw", raw: JSON.stringify({ sourceLocationId: pm.environment.get("sourceLocationId"), destinationLocationId: pm.environment.get("destinationLocationId"), itemId: pm.environment.get("itemId"), quantity: 5 }) }',
                  '  }, function (err, res) {',
                  '    if (res && res.code === 201) {',
                  '      var tid = res.json().id;',
                  '      pm.sendRequest({ url: pm.environment.get("baseUrl") + "/transfers/" + tid + "/dispatch", method: "POST", header: { "Authorization": "Bearer " + pm.environment.get("operationsToken") } }, function() {',
                  '        pm.sendRequest({ url: pm.environment.get("baseUrl") + "/transfers/" + tid + "/receive", method: "POST", header: { "Authorization": "Bearer " + pm.environment.get("operationsToken") } }, function() { pm.environment.set("receivedTransferId", tid); });',
                  '      });',
                  '    }',
                  '  });',
                  '}'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.test("Status code is 409 Conflict", function () { pm.response.to.have.status(409); });']
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{operationsToken}}' }],
            url: { raw: '{{baseUrl}}/transfers/{{receivedTransferId}}/receive', host: ['{{baseUrl}}'], path: ['transfers', '{{receivedTransferId}}', 'receive'] }
          }
        },
        {
          name: 'Invalid Negative Quantity (400 Bad Request)',
          event: [
            { listen: 'prerequest', script: { exec: autoAuthPreRequest } },
            { listen: 'test', script: { exec: ['pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });'] } }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                locationId: '{{locationId}}',
                itemId: '{{itemId}}',
                requiredQuantity: -5,
                assignedUserId: '{{userId}}'
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/work-orders', host: ['{{baseUrl}}'], path: ['work-orders'] }
          }
        },
        {
          name: 'Unauthorized Role Access (403 Forbidden)',
          event: [
            { listen: 'prerequest', script: { exec: [...autoSalesPreRequest, ...autoAuthPreRequest] } },
            { listen: 'test', script: { exec: ['pm.test("Status code is 403 Forbidden", function () { pm.response.to.have.status(403); });'] } }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                locationId: '{{locationId}}',
                itemId: '{{itemId}}',
                requiredQuantity: 10,
                assignedUserId: '{{userId}}'
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/work-orders', host: ['{{baseUrl}}'], path: ['work-orders'] }
          }
        }
      ]
    },
    {
      name: 'FINAL BUSINESS FLOW',
      item: [
        {
          name: '1. Login Admin',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'admin@example.com', password: 'Password123!' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 200", function () { pm.response.to.have.status(200); });',
                  'var data = pm.response.json();',
                  'pm.environment.set("adminToken", data.token);',
                  'pm.environment.set("userId", data.user.id);'
                ]
              }
            }
          ]
        },
        {
          name: '2. Get Inventory',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/inventory', host: ['{{baseUrl}}'], path: ['inventory'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 200", function () { pm.response.to.have.status(200); });',
                  'var data = pm.response.json();',
                  'if (data.length > 0) {',
                  '  pm.environment.set("itemId", data[0].itemId);',
                  '  pm.environment.set("locationId", data[0].locationId);',
                  '  pm.environment.set("blrLocationId", data[0].locationId);',
                  '  var otherLoc = data.find(function(i) { return i.locationId !== data[0].locationId; });',
                  '  if (otherLoc) {',
                  '    pm.environment.set("maaLocationId", otherLoc.locationId);',
                  '    pm.environment.set("sourceLocationId", otherLoc.locationId);',
                  '    pm.environment.set("destinationLocationId", data[0].locationId);',
                  '  }',
                  '}'
                ]
              }
            }
          ]
        },
        {
          name: '3. Create Work Order',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                locationId: '{{blrLocationId}}',
                itemId: '{{itemId}}',
                requiredQuantity: 50,
                assignedUserId: '{{userId}}'
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/work-orders', host: ['{{baseUrl}}'], path: ['work-orders'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 201", function () { pm.response.to.have.status(201); });',
                  'var data = pm.response.json();',
                  'pm.environment.set("flowWorkOrderId", data.id);'
                ]
              }
            }
          ]
        },
        {
          name: '4. Check Stock Availability',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/work-orders/{{flowWorkOrderId}}', host: ['{{baseUrl}}'], path: ['work-orders', '{{flowWorkOrderId}}'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 200", function () { pm.response.to.have.status(200); });',
                  'var data = pm.response.json();',
                  'pm.test("Shortage quantity computed", function () { pm.expect(data.shortageQuantity).to.be.a("number"); });'
                ]
              }
            }
          ]
        },
        {
          name: '5. Create Internal Transfer',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                sourceLocationId: '{{sourceLocationId}}',
                destinationLocationId: '{{destinationLocationId}}',
                itemId: '{{itemId}}',
                quantity: 10
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/transfers', host: ['{{baseUrl}}'], path: ['transfers'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 201", function () { pm.response.to.have.status(201); });',
                  'var data = pm.response.json();',
                  'pm.environment.set("flowTransferId", data.id);'
                ]
              }
            }
          ]
        },
        {
          name: '6. Dispatch Transfer',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/transfers/{{flowTransferId}}/dispatch', host: ['{{baseUrl}}'], path: ['transfers', '{{flowTransferId}}', 'dispatch'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: ['pm.test("Status code 200", function () { pm.response.to.have.status(200); });']
              }
            }
          ]
        },
        {
          name: '7. Get Inventory Post Dispatch',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/inventory', host: ['{{baseUrl}}'], path: ['inventory'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: ['pm.test("Status code 200", function () { pm.response.to.have.status(200); });']
              }
            }
          ]
        },
        {
          name: '8. Receive Transfer',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/transfers/{{flowTransferId}}/receive', host: ['{{baseUrl}}'], path: ['transfers', '{{flowTransferId}}', 'receive'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: ['pm.test("Status code 200", function () { pm.response.to.have.status(200); });']
              }
            }
          ]
        },
        {
          name: '9. Get Inventory Post Receive',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/inventory', host: ['{{baseUrl}}'], path: ['inventory'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: ['pm.test("Status code 200", function () { pm.response.to.have.status(200); });']
              }
            }
          ]
        },
        {
          name: '10. Login Sales',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'sales@example.com', password: 'Password123!' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 200", function () { pm.response.to.have.status(200); });',
                  'var data = pm.response.json();',
                  'pm.environment.set("salesToken", data.token);'
                ]
              }
            }
          ]
        },
        {
          name: '11. Create Customer',
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  'pm.environment.set("randomFlowCustomerEmail", "flow.customer." + Date.now() + "@example.com");'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 201", function () { pm.response.to.have.status(201); });',
                  'var data = pm.response.json();',
                  'pm.environment.set("flowCustomerId", data.id);'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Business Flow Customer',
                phone: '+91 9123456789',
                email: '{{randomFlowCustomerEmail}}',
                companyName: 'Flow Tech Industries'
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/customers', host: ['{{baseUrl}}'], path: ['customers'] }
          }
        },
        {
          name: '12. Create Customer Order',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                customerId: '{{flowCustomerId}}',
                items: [{ itemId: '{{itemId}}', quantity: 5, unitPrice: 1500 }]
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/orders', host: ['{{baseUrl}}'], path: ['orders'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 201", function () { pm.response.to.have.status(201); });',
                  'var data = pm.response.json();',
                  'pm.environment.set("flowOrderId", data.id);'
                ]
              }
            }
          ]
        },
        {
          name: '13. Reserve Stock',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ locationId: '{{blrLocationId}}' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/orders/{{flowOrderId}}/reserve', host: ['{{baseUrl}}'], path: ['orders', '{{flowOrderId}}', 'reserve'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: ['pm.test("Status code 200", function () { pm.response.to.have.status(200); });']
              }
            }
          ]
        },
        {
          name: '14. Attempt Over Reservation Failure',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                customerId: '{{flowCustomerId}}',
                items: [{ itemId: '{{itemId}}', quantity: 99999, unitPrice: 1500 }]
              }, null, 2)
            },
            url: { raw: '{{baseUrl}}/orders', host: ['{{baseUrl}}'], path: ['orders'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 201 Created Order Draft", function () { pm.response.to.have.status(201); });',
                  'var data = pm.response.json();',
                  'pm.environment.set("excessOrderId", data.id);',
                  'pm.environment.set("overReserveOrderId", data.id);'
                ]
              }
            }
          ]
        },
        {
          name: '15. Verify Over-Reservation 409 Conflict',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{salesToken}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ locationId: '{{blrLocationId}}' }, null, 2)
            },
            url: { raw: '{{baseUrl}}/orders/{{excessOrderId}}/reserve', host: ['{{baseUrl}}'], path: ['orders', '{{excessOrderId}}', 'reserve'] }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code 409 Conflict for Over-reservation", function () { pm.response.to.have.status(409); });'
                ]
              }
            }
          ]
        }
      ]
    }
  ]
};

const environment = {
  name: 'Mini Operations ERP Environment',
  values: [
    { key: 'baseUrl', value: 'http://localhost:5000/api', enabled: true },
    { key: 'token', value: '', enabled: true },
    { key: 'adminToken', value: '', enabled: true },
    { key: 'operationsToken', value: '', enabled: true },
    { key: 'salesToken', value: '', enabled: true },
    { key: 'userId', value: '', enabled: true }
  ]
};

const postmanDir = path.join(__dirname);
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

fs.writeFileSync(
  path.join(postmanDir, 'Mini-Operations-ERP.postman_collection.json'),
  JSON.stringify(collection, null, 2)
);

fs.writeFileSync(
  path.join(postmanDir, 'Mini-Operations-ERP.postman_environment.json'),
  JSON.stringify(environment, null, 2)
);

console.log('[Postman Generator] Collection and Environment files generated successfully with Self-Healing Pre-Requests!');
