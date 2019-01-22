//Import Depedencies
const express = require('express');
const enrichmentRouter = express.Router();
const swaggerJSDoc = require('swagger-jsdoc');

const { validatorGconvert, enrichment } = require('../../external-services/gprofiler');
const { generateEnrichmentNetworkJson } = require('./visualization');
const { getPathwayInfoTable } = require('./visualization/pathway-table');

// swagger definition
let swaggerDefinition = {
  info: {
    title: 'Enrichment Services',
    version: '1.0.0',
    description: 'This is a Pathway Commons enrichment application service server.',
    license: {
      name: "MIT",
      url: "https://github.com/PathwayCommons/app-ui/blob/master/LICENSE"
    }
  },
  basePath: '/api/enrichment',
  "tags": [
    {
      "name": "Validation Service",
      "description": "Validate gene list against a selection of target biological databases"
    },
    {
      "name": "Analysis Service",
      "description": "Determine related pathways based on gene list \n Only Gene Ontology Biological Processes and Reactome Pathways are queried \n Versions: Gene Ontology: Ensembl v90 / Ensembl Genomes v37, Reactome: v56"
    },
    {
      "name": "Visualization Service",
      "description": "Generate network information \n Networks are comprised of Gene Ontology Biological Processes and Reactome Pathways \n Arbitrary key-value pairs under a pathway ID are passed-through to nodes."
    }
  ]
};

// options for swagger jsdoc
let options = {
  swaggerDefinition: swaggerDefinition, // swagger definition
  apis: ['./src/server/routes/enrichment/index.js'], // path where API specification are written
};

// initialize swaggerJSDoc
let swaggerSpec = swaggerJSDoc(options);

// route for swagger.json
enrichmentRouter.get('/swagger.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

enrichmentRouter.get('/docs', ( req, res ) => {
  res.render('swagger.html');
});

/**
 * @swagger
 * "/validation":
 *   post:
 *     tags:
 *     - Validation Service
 *     summary: ''
 *     description: ''
 *     operationId: geneQuery
 *     consumes:
 *     - application/json
 *     produces:
 *     - application/json
 *     parameters:
 *     - in: body
 *       name: body
 *       description: Query list and optional parameters for proper formatting
 *       required: true
 *       schema:
 *         "$ref": "#/definitions/input/validationObj"
 *     responses:
 *       '200':
 *         description: Successful operation
 *         schema:
 *           "$ref": "#/definitions/success/validationSuccess"
 *       '400':
 *         description: Invalid input (organism, targetDb, or JSON format)
 *         schema:
 *           "$ref": "#/definitions/error/validationError"
*/
// expose a rest endpoint for validation service
enrichmentRouter.post('/validation', (req, res, next) => {
  const query = req.body.query;
  const tmpOptions = {
    target: req.body.targetDb
  };
  validatorGconvert(query, tmpOptions)
    .then( result => res.json( result ))
    .catch( next );
});


/**
 *@swagger
 * "/analysis":
 *   post:
 *     tags:
 *     - Analysis Service
 *     summary: ''
 *     description: ''
 *     operationId: enrichment
 *     consumes:
 *     - application/json
 *     produces:
 *     - application/json
 *     parameters:
 *     - in: body
 *       name: body
 *       description: Gene list and optional parameters
 *       required: true
 *       schema:
 *         "$ref": "#/definitions/input/analysisObj"
 *     responses:
 *       '200':
 *         description: Successful operation
 *         schema:
 *           "$ref": "#/definitions/success/analysisSuccess"
 *       '400':
 *         description: Invalid input (minSetSize, maxSetSize, backgroundGenes or JSON format)
 *         schema:
 *           "$ref": "#/definitions/error/analysisError"
*/
// expose a rest endpoint for enrichment service
enrichmentRouter.post('/analysis', (req, res, next) => {
  let { query, minSetSize, maxSetSize, background } = req.body;
  let opts = { minSetSize, maxSetSize, background };

  enrichment(query, opts).then(enrichmentResult => res.json( enrichmentResult ) ).catch( next );
});


/**
 * @swagger
 * "/visualization":
 *   post:
 *     tags:
 *     - Visualization Service
 *     summary: ''
 *     description: ''
 *     operationId: emap
 *     consumes:
 *     - application/json
 *     produces:
 *     - application/json
 *     parameters:
 *     - in: body
 *       name: body
 *       description: Display output from enrichment service
 *       required: true
 *       schema:
 *         "$ref": "#/definitions/input/visualizationObj"
 *     responses:
 *       '200':
 *         description: Successful operation
 *         schema:
 *           "$ref": "#/definitions/success/visualizationSuccess"
 *       '400':
 *         description: invalid input (similarityCutoff, jaccardOverlapWeight or JSON format)
 *         schema:
 *           "$ref": "#/definitions/error/visualizationError"
*/
// Expose a rest endpoint for visualization service
enrichmentRouter.post('/visualization', (req, res, next) => {
  let { pathways, similarityCutoff, jaccardOverlapWeight } = req.body;

  Promise.resolve()
  .then( () => getPathwayInfoTable() )
  .then( pathwayInfoTable => generateEnrichmentNetworkJson( pathwayInfoTable, pathways, similarityCutoff, jaccardOverlapWeight ) )
  .then( enrichmentNetwork => res.json( enrichmentNetwork ) )
  .catch( next );
});


/**
 * @swagger
 * definitions:
 *   error:
 *     validationError:
 *       type: object
 *       properties:
 *         invalidTargetDb:
 *           type: string
 *           example: ENSGGGGG
 *         invalidOrganism:
 *           type: string
 *           example: hsapiensss
 *     analysisError:
 *       type: string
 *       example: 'ERROR: minSetSize should be >= 0'
 *     visualizationError:
 *       type: string
 *       example: 'ERROR: jaccardOverlapWeight should be a number'
 *   input:
 *     validationObj:
 *       type: object
 *       required:
 *       - query
 *       properties:
 *         query:
 *           type: array
 *           description: "Input (human biological identifiers) as an array.
 *                        \n Integer interpreted as NCBI Gene ID."
 *           example: ["TP53", "111", "AFF4", "111", "11998"]
 *           items:
 *             type: string
 *         targetDb:
 *           type: string
 *           description: "MIRIAM collection namespace to map to (see http://identifiers.org/) \n Default: hgnc"
 *           example: "ensembl"
 *           enum:
 *           - "ensembl"
 *           - "hgnc"
 *           - "hgnc.symbol"
 *           - "ncbigene"
 *           - "uniprot"
 *     analysisObj:
 *       type: object
 *       required:
 *       - genes
 *       properties:
 *         query:
 *           type: array
 *           description: Biological identifiers [ ENSG, HGNCSYMBOL, HGNC, UNIPROT, NCBIGENE ]
 *           example: ["AFF4"]
 *           items:
 *             type: string
 *         minSetSize:
 *           type: number
 *           description: "minimum size of functional category, smaller categories are
 *             excluded \n default: 5"
 *           example: 3
 *         maxSetSize:
 *           type: number
 *           description: "maximum size of functional category, larger categories are
 *             excluded \n default: 200"
 *           example: 400
 *         background:
 *           type: array
 *           description: "Biological identifiers used
 *             as a custom statistical background \n default: []"
 *           example: []
 *           items:
 *             type: string
 *     visualizationObj:
 *       type: object
 *       required:
 *       - pathways
 *       properties:
 *         pathways:
 *           type: array
 *           description: pathway objects
 *           items:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The g:GOSt formatted node id
 *                 example: GO:0006354
 *               data:
 *                 type: object
 *                 description: Additional data forwarded to nodes
 *                 example:
 *                   name: DNA-templated transcription, elongation
 *                   p_value: 1.29e-03
 *         similarityCutoff:
 *           type: number
 *           description: "cutoff point for filtering edge similarity rates
 *             pairwise \n default: 0.375"
 *           example: 0.3
 *         jaccardOverlapWeight:
 *           type: number
 *           description: "similarity measurement between sample sets, calculated by dividing the magnitude of intersection by the magnitude of union
 *             \n valid range: [0,1]"
 *           example: 0.55
 *   success:
 *     validationSuccess:
 *       type: object
 *       required:
 *       - unrecognized
 *       - duplicate
 *       - alias
 *       properties:
 *         unrecognized:
 *           type: array
 *           items:
 *             type: string
 *             example: ATP
 *         duplicate:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: string
 *               example: '11998'
 *         alias:
 *           type: object
 *           properties:
 *             initial alias (TP53):
 *               type: string
 *               example: converted alias (HGNC:11998)
 *     analysisSuccess:
 *       type: object
 *       required:
 *       - pathways
 *       properties:
 *         pathways:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: GO:0006354
 *               data:
 *                 type: object
 *                 properties:
 *                   p_value:
 *                     type: string
 *                     example: 1.29e-03
 *                   name:
 *                     type: string
 *                     example: DNA-templated transcription, elongation
 *                   intersection:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: PAF1
 *     visualizationSuccess:
 *       type: object
 *       required:
 *       - unrecognized
 *       - graph
 *       properties:
 *         unrecognized:
 *           type: array
 *           items:
 *             type: string
 *             example: GO:1
 *         graph:
 *           type: object
 *           required:
 *           - elements
 *           properties:
 *             elements:
 *               type: object
 *               required:
 *               - nodes
 *               - edges
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     "$ref": "#/definitions/success/nodeData"
 *                 edges:
 *                   type: array
 *                   items:
 *                     "$ref": "#/definitions/success/edgeData"
 *     edgeData:
 *       type: object
 *       required:
 *       - data
 *       properties:
 *         data:
 *           type: object
 *           required:
 *           - id
 *           - source
 *           - target
 *           - similarity
 *           - intersection
 *           properties:
 *             id:
 *               type: string
 *               example: GO:0043525_GO:0043523
 *             source:
 *               type: string
 *               example: GO:0043525
 *             target:
 *               type: string
 *               example: GO:0043523
 *             similarity:
 *               type: number
 *               example: 0.5923
 *             intersection:
 *               type: array
 *               items:
 *                 type: string
 *                 example:
 *                 - FIS1
 *                 - HDAC4
 *                 - BCL2L11
 *     nodeData:
 *       type: object
 *       required:
 *       - data
 *       properties:
 *         data:
 *           type: object
 *           required:
 *           - id
 *           - name
 *           - geneCount
 *           - geneSet
 *           - uri
 *           - namespace
 *           properties:
 *             id:
 *               type: string
 *               example: GO:0043525
 *             name:
 *               type: string
 *               example: DNA-templated transcription, elongation
 *             geneCount:
 *               type: number
 *               example: 51
 *             geneSet:
 *               type: array
 *               items:
 *                 type: string
 *                 example:
 *                 - TP53
 *                 - CASP9
 *                 - CDK5
 *             uri:
 *               type: string
 *               example: http://identifiers.org/go/GO:0006354
 *             namespace:
 *               type: string
 *               example: go
*/


module.exports = enrichmentRouter;