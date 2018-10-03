//Import Depedencies
const express = require('express');
const enrichmentRouter = express.Router();
const swaggerJSDoc = require('swagger-jsdoc');
const { validatorGconvert, enrichment } = require('../../external-services/gprofiler');
const { generateGraphInfo } = require('./visualization');

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
enrichmentRouter.post('/validation', (req, res) => {
  const query = req.body.query;
  const tmpOptions = {};
  tmpOptions.organism = req.body.organism;
  tmpOptions.target = req.body.targetDb;
  validatorGconvert(query, tmpOptions).then(gconvertResult => {
    res.json(gconvertResult);
  }).catch( error => res.status( 400 ).send( error ) );
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
enrichmentRouter.post('/analysis', (req, res) => {
  const query = req.body.query.sort();
  const tmpOptions = {
    minSetSize: req.body.minSetSize,
    maxSetSize: req.body.maxSetSize,
    background: req.body.background
  };

  enrichment(query, tmpOptions).then(enrichmentResult => {
    res.json(enrichmentResult);
  }).catch((err) => {
    res.status(400).send(err.message);
  });
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
enrichmentRouter.post('/visualization', (req, res) => {
  const pathways = req.body.pathways;
  const similarityCutoff = req.body.similarityCutoff;
  const jaccardOverlapWeight = req.body.jaccardOverlapWeight;
  try {
    res.json(generateGraphInfo(pathways, similarityCutoff, jaccardOverlapWeight));
  } catch (err) {
    res.status(400).send(err.message);
  }
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
 *           description: "Input (identifiers) as an array.
 *                        \n Integer interpreted as NCBI Gene ID."
 *           example: ["TP53", "111", "AFF4", "111", "11998"]
 *           items:
 *             type: string
 *         targetDb:
 *           type: string
 *           description: "Target database nomenclature to convert gene list to\n Default: HGNC"
 *           enum:
 *           - ENSG
 *           - HGNCSYMBOL
 *           - HGNC
 *           - UNIPROT
 *           - NCBIGENE
 *         organism:
 *           type: string
 *           description: "Organism to analyze
 *                        \n Naming convention: first character of the full Latin name concatonated with the second portion of the name
 *                        \n Default: hsapiens"
 *           example: "hsapiens"
 *           enum:
 *           - aaegypti
 *           - acarolinensis
 *           - agambiae
 *           - amelanoleuca
 *           - amexicanus
 *           - aplatyrhynchos
 *           - btaurus
 *           - caperea
 *           - cchok1gshd
 *           - ccrigri
 *           - celegans
 *           - cfamiliaris
 *           - choffmanni
 *           - cintestinalis
 *           - cjacchus
 *           - clanigera
 *           - cporcellus
 *           - csabaeus
 *           - csavignyi
 *           - csyrichta
 *           - dmelanogaster
 *           - dnovemcinctus
 *           - dordii
 *           - drerio
 *           - ecaballus
 *           - eeuropaeus
 *           - etelfairi
 *           - falbicollis
 *           - fcatus
 *           - fdamarensis
 *           - gaculeatus
 *           - ggallus
 *           - ggorilla
 *           - gmorhua
 *           - hfemale
 *           - hmale
 *           - hsapiens
 *           - itridecemlineatus
 *           - jjaculus
 *           - lafricana
 *           - lchalumnae
 *           - loculatus
 *           - mauratus
 *           - mcaroli
 *           - mdomestica
 *           - mfuro
 *           - mgallopavo
 *           - mlucifugus
 *           - mmulatta
 *           - mmurinus
 *           - mmusculus
 *           - mochrogaster
 *           - mpahari
 *           - mspreteij
 *           - neugenii
 *           - ngalili
 *           - nleucogenys
 *           - oanatinus
 *           - oaries
 *           - ocuniculus
 *           - odegus
 *           - ogarnettii
 *           - olatipes
 *           - oniloticus
 *           - oprinceps
 *           - pabelii
 *           - panubis
 *           - pbairdii
 *           - pcapensis
 *           - pformosa
 *           - pmarinus
 *           - psinensis
 *           - ptroglodytes
 *           - pvampyrus
 *           - rnorvegicus
 *           - saraneus
 *           - scerevisiae
 *           - sharrisii
 *           - sscrofa
 *           - tbelangeri
 *           - tguttata
 *           - tnigroviridis
 *           - trubripes
 *           - ttruncatus
 *           - vpacos
 *           - xmaculatus
 *           - xtropicalis
 *           - aclavatus
 *           - aflavus
 *           - afumigatus
 *           - afumigatusa1163
 *           - agossypii
 *           - anidulans
 *           - aniger
 *           - aoryzae
 *           - aterreus
 *           - bbassiana
 *           - bcinerea
 *           - bgraminis
 *           - cgloeosporioides
 *           - cgraminicola
 *           - chigginsianum
 *           - cneoformans
 *           - corbiculare
 *           - dseptosporum
 *           - fculmorum
 *           - ffujikuroi
 *           - fgraminearum
 *           - foxysporum
 *           - fpseudograminearum
 *           - fsolani
 *           - fverticillioides
 *           - ggraminis
 *           - kpastoris
 *           - lmaculans
 *           - mlaricipopulina
 *           - moryzae
 *           - mpoae
 *           - mviolaceum
 *           - ncrassa
 *           - nfischeri
 *           - pgraminis
 *           - pgraminisug99
 *           - pnodorum
 *           - pstriiformis
 *           - pteres
 *           - ptriticina
 *           - ptriticirepentis
 *           - scerevisiae
 *           - scryophilus
 *           - sjaponicus
 *           - soctosporus
 *           - spombe
 *           - sreilianum
 *           - ssclerotiorum
 *           - tmelanosporum
 *           - treesei
 *           - tvirens
 *           - umaydis
 *           - vdahliae
 *           - ylipolytica
 *           - ztritici
 *           - aaegypti
 *           - acephalotes
 *           - adarlingi
 *           - agambiae
 *           - aglabripennis
 *           - amellifera
 *           - apisum
 *           - aqueenslandica
 *           - avaga
 *           - bantarctica
 *           - bimpatiens
 *           - bmalayi
 *           - bmori
 *           - cbrenneri
 *           - cbriggsae
 *           - celegans
 *           - cgigas
 *           - cjaponica
 *           - cquinquefasciatus
 *           - cremanei
 *           - cteleta
 *           - dananassae
 *           - derecta
 *           - dgrimshawi
 *           - dmelanogaster
 *           - dmojavensis
 *           - dpersimilis
 *           - dplexippus
 *           - dponderosae
 *           - dpseudoobscura
 *           - dpulex
 *           - dsechellia
 *           - dsimulans
 *           - dvirilis
 *           - dwillistoni
 *           - dyakuba
 *           - hmelpomene
 *           - hrobusta
 *           - iscapularis
 *           - lanatina
 *           - lcuprina
 *           - lgigantea
 *           - lloa
 *           - lsalmonis
 *           - mcinxia
 *           - mdestructor
 *           - mleidyi
 *           - mscalaris
 *           - nvectensis
 *           - nvitripennis
 *           - obimaculoides
 *           - ovolvulus
 *           - phumanus
 *           - ppacificus
 *           - rprolixus
 *           - sinvicta
 *           - smansoni
 *           - smaritima
 *           - smimosarum
 *           - spurpuratus
 *           - sratti
 *           - sscabiei
 *           - tadhaerens
 *           - tcastaneum
 *           - tkitauei
 *           - tspiralis
 *           - turticae
 *           - znevadensis
 *           - alyrata
 *           - atauschii
 *           - athaliana
 *           - atrichopoda
 *           - bdistachyon
 *           - bnapus
 *           - boleracea
 *           - brapa
 *           - bvulgaris
 *           - ccrispus
 *           - cmerolae
 *           - creinhardtii
 *           - gmax
 *           - gsulphuraria
 *           - hvulgare
 *           - lperrieri
 *           - macuminata
 *           - mtruncatula
 *           - obarthii
 *           - obrachyantha
 *           - oglaberrima
 *           - oglumaepatula
 *           - oindica
 *           - olongistaminata
 *           - olucimarinus
 *           - omeridionalis
 *           - onivara
 *           - opunctata
 *           - orufipogon
 *           - osativa
 *           - ppatens
 *           - ppersica
 *           - ptrichocarpa
 *           - sbicolor
 *           - sitalica
 *           - slycopersicum
 *           - smoellendorffii
 *           - stuberosum
 *           - taestivum
 *           - tcacao
 *           - tpratense
 *           - turartu
 *           - vvinifera
 *           - zmays
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
 *           type: object
 *           description: pathway information keyed by pathway ID
 *           additionalProperties: object
 *           example:
 *             GO:0043525: {}
 *             GO:0043523:
 *               p_value: 0.05
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
 *       - geneInfo
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
 *         geneInfo:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               initialAlias:
 *                 type: string
 *                 example: TP53
 *               convertedAlias:
 *                 type: string
 *                 example: HGNC:11998
 *     analysisSuccess:
 *       type: object
 *       required:
 *       - pathwayInfo
 *       properties:
 *         pathwayInfo:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             required:
 *             - p_value
 *             - description
 *             - intersection
 *             properties:
 *               p_value:
 *                 type: string
 *                 example: 0.2
 *               description:
 *                 type: string
 *                 example: DNA-templated transcription, elongation
 *               intersection:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: AFF4
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
 *           properties:
 *             id:
 *               type: string
 *               example: GO:0043525
 *             p_value:
 *               type: number
 *               example: 0.2
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
*/


module.exports = enrichmentRouter;