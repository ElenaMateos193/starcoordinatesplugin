export default function (server){

  const {callWithRequest} = server.plugins.elasticsearch.getCluster('data');

  server.route({
    path:'/api/starcoordinates/example',
    method: 'GET',
    handler: async function (req, res){
      let resp = {}
      try{
        resp = await callWithRequest(req, 'search', {
          index: 'hot100billboardaudiofeatures',
          size: 10,
          body: {
            query: {
              match: {
                spotify_genre: "pop"
              }
            }
          }
        })
      } catch (errResp){
        resp = errResp
      }
      return {body: resp}
    }
  });
 }
  