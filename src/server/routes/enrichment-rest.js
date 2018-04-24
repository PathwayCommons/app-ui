//Import Depedencies
const express = require('express');
const enrichmentRouter = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const { validatorGconvert } = require('../enrichment/validation');
const { enrichment } = require('../enrichment/analysis');
const { generateGraphInfo } = require('../enrichment/visualization');

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'Enrichment Services',
    version: '1.0.0',
    description: 'This is a sample enrichment service server. You can find detailed documentation at [Wiki](https://github.com/PathwayCommons/app-ui/wiki/Enrichment-Map-Services)',
    documentation: "https://github.com/PathwayCommons/app-ui/wiki/Enrichment-Services",
    license: {
      name: "MIT",
      url: "https://github.com/PathwayCommons/app-ui/blob/master/LICENSE"
    }
  },
  host: 'localhost:3000',
  basePath: '/api/',
  "tags": [
    {
      "name": "Gene Validation Service",
      "description": "Validate gene list"
    },
    {
      "name": "Analysis Service",
      "description": "Summarize gene list as pathway list \n Only Gene Ontology Biological Process terms and Reactome pathways are queried. \n Versions: Gene Ontolody: Ensembl v90 / Ensembl Genomes v37, Reactome: v56"
    },
    {
      "name": "Visualization Service",
      "description": "Generate graph information \n Only Gene Ontology Biological Process and Reactome are supported. \n Arbitrary key-value pairs under a pathway ID are passed-through to nodes."
    }
  ]
};

// options for swagger jsdoc
var options = {
  swaggerDefinition: swaggerDefinition, // swagger definition
  apis: ['./src/server/routes/enrichment-rest.js'], // path where API specification are written
};

// initialize swaggerJSDoc
var swaggerSpec = swaggerJSDoc(options);

// route for swagger.json
enrichmentRouter.get('/swagger.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


const controller = require('./controller');
const config = require('../../config');


const isAuthenticated = token => {
  return config.MASTER_PASSWORD != '' && config.MASTER_PASSWORD === token;
};


/**
 * @swagger
 * "/validation":
 *   post:
 *     tags:
 *     - Gene Validation Service
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
 *       description: query list and optional parameters
 *       required: true
 *       schema:
 *         "$ref": "#/definitions/input/validationObj"
 *     responses:
 *       '200':
 *         description: Success response
 *         schema:
 *           "$ref": "#/definitions/success/validationSuccess"
 *       '400':
 *         description: Invalid input (organism, target, or JSON format)
 *         schema:
 *           "$ref": "#/definitions/error/validationError"
*/
// expose a rest endpoint for gconvert validator
enrichmentRouter.post('/validation', (req, res) => {
  const genes = req.body.genes;
  const tmpOptions = {};
  const userOptions = {};
  tmpOptions.organism = req.body.organism;
  tmpOptions.target = req.body.target;
  validatorGconvert(genes, tmpOptions).then(gconvertResult => {
    res.json(gconvertResult);
  }).catch((invalidInfoError) => {
    res.status(400).send({ invalidTarget: invalidInfoError.invalidTarget, invalidOrganism: invalidInfoError.invalidOrganism });
  });
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
 *       description: gene list and optional parameters
 *       required: true
 *       schema:
 *         "$ref": "#/definitions/input/analysisObj"
 *     responses:
 *       '200':
 *         description: Success response
 *         schema:
 *           "$ref": "#/definitions/success/analysisSuccess"
 *       '400':
 *         description: Invalid input (orderedQuery, userThr, minSetSize, maxSetSize,
 *           thresholdAlgo, custbg or JSON format)
 *         schema:
 *           "$ref": "#/definitions/error/analysisError"
*/
// expose a rest endpoint for enrichment
enrichmentRouter.post('/analysis', (req, res) => {
  const genes = req.body.genes;

  const tmpOptions = {
    orderedQuery: req.body.orderedQuery,
    userThr: req.body.userThr,
    minSetSize: req.body.minSetSize,
    maxSetSize: req.body.maxSetSize,
    thresholdAlgo: req.body.thresholdAlgo,
    custbg: req.body.custbg
  };

  enrichment(genes, tmpOptions).then(enrichmentResult => {
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
 *       description: output from enrichment service
 *       required: true
 *       schema:
 *         "$ref": "#/definitions/input/visualizationObj"
 *     responses:
 *       '200':
 *         description: Success response
 *         schema:
 *           "$ref": "#/definitions/success/visualizationSuccess"
 *       '400':
 *         description: invalid input (cutoff, OCweight, JCWeight or JSON format)
 *         schema:
 *           "$ref": "#/definitions/error/visualizationError"
*/
// Expose a rest endpoint for emap
enrichmentRouter.post('/visualization', (req, res) => {
  const pathwayInfoList = req.body.pathwayInfoList;
  const cutoff = req.body.cutoff;
  const JCWeight = req.body.JCWeight;
  const OCWeight = req.body.OCWeight;
  try {
    res.json(generateGraphInfo(pathwayInfoList, cutoff, JCWeight, OCWeight));

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
 *         invalidTarget:
 *           type: string
 *           example: ENSGGGGG
 *         invalidOrganism:
 *           type: string
 *           example: hsapiensss
 *     analysisError:
 *       type: string
 *       example: 'ERROR: orderedQuery should be 1 or 0'
 *     visualizationError:
 *       type: string
 *       example: 'ERROR: OCWeight + JCWeight should be 1'
 *   input:
 *     validationObj:
 *       type: object
 *       required:
 *       - genes
 *       properties:
 *         genes:
 *           type: array
 *           description: an array of genes, integers
 *             are interpreted as NCBIGENE
 *           example: ["TP53", "111", "AFF4", "111", "11998"]
 *           items:
 *             type: string
 *         target:
 *           type: string
 *           description: "target database (namespace) for conversion \n default: HGNC"
 *           enum:
 *           - ENSG
 *           - HGNCSYMBOL
 *           - HGNC
 *           - UNIPROT
 *           - NCBIGENE
 *         organism:
 *           type: string
 *           description: "organism identifier \n default: hsapiens"
 *           example: hsapiens
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
 *         genes:
 *           type: array
 *           description: an array of genes
 *           example: ["AFF4"]
 *           items:
 *             type: string
 *         orderedQuery:
 *           type: boolean
 *           description: "genes are placed in some biologically meaningful order \n
 *             default: false"
 *           example: false
 *         userThr:
 *           type: number
 *           description: "user-specified p-value threshold, results with a larger p-value
 *             are excluded \n default: 0.05"
 *           example: 0.07
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
 *         thresholdAlgo:
 *           type: string
 *           description: "the algorithm used for determining the significance threshold
 *             \n default: fdr"
 *           enum:
 *           - fdr
 *           - analytical
 *           - bonferroni
 *         custbg:
 *           type: array
 *           description: "an array of genes used
 *             as a custom statistical background \n default: []"
 *           example: []
 *           items:
 *             type: string
 *     visualizationObj:
 *       type: object
 *       required:
 *       - pathwayInfoList
 *       properties:
 *         pathwayInfoList:
 *           type: object
 *           description: pathway information keyed by pathway ID
 *           additionalProperties: object
 *           example:
 *             GO:0043525: {}
 *             GO:0043523:
 *               p-value: 0.05
 *         cutoff:
 *           type: number
 *           description: "cutoff point used for filtering similaritiy rates of edges
 *             pairwise \n default: 0.375"
 *           example: 0.3
 *         JCWeight:
 *           type: number
 *           description: weight for Jaccard coefficient
 *           example: 0.55
 *         OCWeight:
 *           type: number
 *           description: weight for overlap coefficient
 *           example: 0.45
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
 *             - p-value
 *             - description
 *             - intersection
 *             properties:
 *               p-value:
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
 *             p-value:
 *               type: number
 *               example: 0.2
*/


module.exports = enrichmentRouter;