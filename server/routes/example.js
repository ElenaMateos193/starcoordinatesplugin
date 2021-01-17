export default function (server){

  const {callWithRequest} = server.plugins.elasticsearch.getCluster('data');

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
      let dateQUery2={gte: req.query.startDate, lte: req.query.endDate};
      dateQuery[req.query.dateFieldName]=dateQUery2;
      let range = {}
      range["range"] = dateQuery
      try{
        let searchParameter = {
          index: req.query.index,
          size: req.query.size
        }
        if(req.query.dateFieldName!=undefined){
          let sort = {}
          sort[req.query.dateFieldName]= {order: "desc"}
          searchParameter["body"]={query: range, sort: [sort]}
        }
        resp = await callWithRequest(req, 'search', searchParameter)
      } catch (errResp){
        resp = errResp
      }
      return {body: resp, query: range}
    }
  });
 }
  