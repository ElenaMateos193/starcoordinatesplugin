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

  server.route({
    path:'/api/starcoordinates/example/getIndices',
    method: 'GET',
    handler: async function (req, res){
      let resp = {}
      try{
        resp = await callWithRequest(req, 'cat.indices', {
          v:true,
          format:'JSON'
        })
      } catch (errResp){
        resp = errResp
      }
      return {body: resp}
    }
  });

  server.route({
    path:'/api/starcoordinates/example/getIndexInfo/{index}',
    method: 'GET',
    handler: async function (req, res){
      var index = req.params.index
      let resp = {}
      try{
        resp = await callWithRequest(req, 'indices.get', {
          index: index,
        })
      } catch (errResp){
        resp = errResp
      }
      return {body: resp}
    }
  });

  server.route({
    path:'/api/starcoordinates/example/get',
    method: 'GET',
    handler: async function (req, res){
      let resp = {}
      let dateQuery={}
      let dateQUery2={gte: req.query.oldestDate}
      Object.defineProperty(dateQuery, req.query.dateFieldName, dateQUery2)
      try{
        resp = await callWithRequest(req, 'search', {
          index: req.query.index,
          size: req.query.size,
          q: {range:dateQuery}
        })
      } catch (errResp){
        resp = errResp
      }
      return {body: resp}
    }
  });
 }
  