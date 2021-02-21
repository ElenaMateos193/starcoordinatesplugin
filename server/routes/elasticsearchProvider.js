export default function (server){

  const {callWithRequest} = server.plugins.elasticsearch.getCluster('data');

  server.route({
    path:'/api/starcoordinates/elasticsearchProvider/getIndices',
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
    path:'/api/starcoordinates/elasticsearchProvider/getIndexInfo/{index}',
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
    path:'/api/starcoordinates/elasticsearchProvider/get',
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

  server.route({
    path:'/api/starcoordinates/elasticsearchProvider/getFieldValues',
    method: 'GET',
    handler: async function (req, res){
      let resp = {}
      try{
        let searchParameter = {
          index: req.query.index,
          body:{aggs:{fieldValues:{terms: {field:req.query.fieldName, size:200}}}}
        }
        resp = await callWithRequest(req, 'search', searchParameter)
      } catch (errResp){
        resp = errResp
      }
      return {body: resp}
    }
  });
 }
  