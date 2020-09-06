const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
exports.webhook = functions.https.onRequest(async (request, response) => {
  functions.logger.info("Printing request");
  functions.logger.info(request);
  functions.logger.info("Done print");

  fulfillmentMessages = [];

  try {
    const params = request.body.queryResult.parameters;
    if (params.category && params.category.length > 0) {
      let categories = params.category;
      const printCategories = categories
        .join(", ")
        .replace(/,([^,]*)$/, " and" + "$1");
      const ref = admin.database().ref("communities");
      let foo = await ref
        .orderByChild("/{communityName}/title")
        .once("value", function (snapshot) {
          const communitiesList = [];
          snapshot.forEach((data) => {
            communitiesList.push(data.val());
          });
          categories = categories.map((x) => x.toLowerCase());
          results = communitiesList.filter((community) => {
            console.log({ community });
            if (community.tags && Object.keys(community.tags).length > 0) {
              console.log(Object.keys(community.tags));
              const found = Object.keys(community.tags).some(
                (r) => categories.indexOf(r.toLowerCase()) >= 0
              );
              return found;
            } else {
              return false;
            }
          });
          if (results && results.length > 0) {
            fulfillmentMessages.push({
              text: {
                text: [
                  `I have found ${results.length} related communit${
                    results.length === 1 ? "y" : "ies"
                  }`,
                ],
              },
            });
            let communityCards = [];
            results.forEach((community, index, array) => {
              communityCards.push({
                image: {
                  src: {
                    rawUrl: "https://picsum.photos/500/500?nocache="+ Date.now(),
                  },
                },
                subtitle: community.desc,
                title: community.title,
                type: "info",
                actionLink: community.url,
              });
              if (index !== array.length - 1) {
                communityCards.push({
                  type: "divider",
                });
              }
            });
            fulfillmentMessages.push({
              payload: {
                richContent: [communityCards],
              },
            });
          } else {
            fulfillmentMessages.push({
              text: {
                text: [
                  "Im sorry but I couldn't find any communities related to " +
                    printCategories,
                ],
              },
            });
          }
        });
    } else {
      fulfillmentMessages.push({
        text: {
          text: [
            "Please include any words that are related to the community you are looking for.",
          ],
        },
      });
    }
  } catch (e) {
    functions.logger.error(e);
  }
  response.send({
    fulfillmentMessages,
  });
});
