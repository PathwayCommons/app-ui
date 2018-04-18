//Import Depedencies
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'Enrichment-Map Services',
    version: '1.0.0',
    description: 'This is a sample enrichment-map service server. You can find detailed documentation at [Wiki](https://github.com/PathwayCommons/app-ui/wiki/Enrichment-Map-Services)',
    documentation: "https://github.com/PathwayCommons/app-ui/wiki/Enrichment-Map-Services",
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
      "name": "Enrichment Service",
      "description": "Summarize gene list as pathway list"
    },
    {
      "name": "Emap Service",
      "description": "Generate graph information"
    }
  ]
};

// options for swagger jsdoc
var options = {
  swaggerDefinition: swaggerDefinition, // swagger definition
  apis: ['./src/server/routes/rest.js'], // path where API specification are written
};

// initialize swaggerJSDoc
var swaggerSpec = swaggerJSDoc(options);

// route for swagger.json
router.get('/swagger.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


const controller = require('./controller');
const config = require('../../config');

const { validatorGconvert } = require('../enrichment-map/gene-validator');
const { enrichment } = require('../enrichment-map/enrichment');

const { generateGraphInfo } = require('../enrichment-map/emap');

const isAuthenticated = token => {
  return config.MASTER_PASSWORD != '' && config.MASTER_PASSWORD === token;
};
const errorMsg = {
  error: 'Invalid access token'
};

// Expose a rest endpoint for controller.submitLayout
router.post('/submit-layout', function (req, res) {
  if (isAuthenticated(req.body.token)) {
    controller.submitLayout(req.body.uri, req.body.version, req.body.layout, req.body.user)
      .then((package) => {
        res.json(package);
      });
  } else {
    res.json(errorMsg);
  }
});

// Expose a rest endpoint for controller.submitGraph
router.post('/submit-graph', function (req, res) {
  if (isAuthenticated(req.body.token)) {
    controller.submitGraph(req.body.uri, req.body.version, req.body.graph)
      .then((package) => {
        res.json(package);
      });
  } else {
    res.json(errorMsg);
  }
});

// Expose a rest endpoint for controller.submitDiff
router.post('/submit-diff', function (req, res) {
  if (isAuthenticated(req.body.token)) {
    controller.submitDiff(req.body.uri, req.body.version, req.body.diff, req.body.user)
      .then((package) => {
        res.json(package);
      });
  } else {
    res.json(errorMsg);
  }
});

// Expose a rest endpoint for controller.getGraphAndLayout
router.get('/get-graph-and-layout', function (req, res) {
  controller.getGraphAndLayout(req.query.uri, req.query.version).then((package) => {
    res.json(package);
  });
});


/**
 * @swagger
 * "/gene-query":
 *   post:
 *     tags:
 *     - Gene Validation Service
 *     summary: Validate gene list
 *     description: ''
 *     operationId: geneQuery
 *     consumes:
 *     - application/json
 *     produces:
 *     - application/json
 *     parameters:
 *     - in: body
 *       name: body
 *       description: Pet object that needs to be added to the store
 *       required: true
 *       schema:
 *         type: object
 *         properties:
 *           genes:
 *             type: string
 *             description: a space-separated (spaces, tabs, newlines) list of genes
 *             required: true
 *             example: TP53 111 AFF4 111 11998
 *           target:
 *             type: string
 *             description: "target database (namespace) for conversion \n default: HGNC"
 *             required: false
 *             enum:
 *             - ENSG
 *             - HGNCSYMBOL
 *             - HGNC
 *             - UNIPROT
 *             - NCBIGENE
 *           organism:
 *             type: string
 *             description: "organism identifier \n default: hsapiens"
 *             required: false
 *             example: hsapiens
 *             enum:
 *             - aaegypti
 *             - acarolinensis
 *             - agambiae
 *             - amelanoleuca
 *             - amexicanus
 *             - aplatyrhynchos
 *             - btaurus
 *             - caperea
 *             - cchok1gshd
 *             - ccrigri
 *             - celegans
 *             - cfamiliaris
 *             - choffmanni
 *             - cintestinalis
 *             - cjacchus
 *             - clanigera
 *             - cporcellus
 *             - csabaeus
 *             - csavignyi
 *             - csyrichta
 *             - dmelanogaster
 *             - dnovemcinctus
 *             - dordii
 *             - drerio
 *             - ecaballus
 *             - eeuropaeus
 *             - etelfairi
 *             - falbicollis
 *             - fcatus
 *             - fdamarensis
 *             - gaculeatus
 *             - ggallus
 *             - ggorilla
 *             - gmorhua
 *             - hfemale
 *             - hmale
 *             - hsapiens
 *             - itridecemlineatus
 *             - jjaculus
 *             - lafricana
 *             - lchalumnae
 *             - loculatus
 *             - mauratus
 *             - mcaroli
 *             - mdomestica
 *             - mfuro
 *             - mgallopavo
 *             - mlucifugus
 *             - mmulatta
 *             - mmurinus
 *             - mmusculus
 *             - mochrogaster
 *             - mpahari
 *             - mspreteij
 *             - neugenii
 *             - ngalili
 *             - nleucogenys
 *             - oanatinus
 *             - oaries
 *             - ocuniculus
 *             - odegus
 *             - ogarnettii
 *             - olatipes
 *             - oniloticus
 *             - oprinceps
 *             - pabelii
 *             - panubis
 *             - pbairdii
 *             - pcapensis
 *             - pformosa
 *             - pmarinus
 *             - psinensis
 *             - ptroglodytes
 *             - pvampyrus
 *             - rnorvegicus
 *             - saraneus
 *             - scerevisiae
 *             - sharrisii
 *             - sscrofa
 *             - tbelangeri
 *             - tguttata
 *             - tnigroviridis
 *             - trubripes
 *             - ttruncatus
 *             - vpacos
 *             - xmaculatus
 *             - xtropicalis
 *             - aclavatus
 *             - aflavus
 *             - afumigatus
 *             - afumigatusa1163
 *             - agossypii
 *             - anidulans
 *             - aniger
 *             - aoryzae
 *             - aterreus
 *             - bbassiana
 *             - bcinerea
 *             - bgraminis
 *             - cgloeosporioides
 *             - cgraminicola
 *             - chigginsianum
 *             - cneoformans
 *             - corbiculare
 *             - dseptosporum
 *             - fculmorum
 *             - ffujikuroi
 *             - fgraminearum
 *             - foxysporum
 *             - fpseudograminearum
 *             - fsolani
 *             - fverticillioides
 *             - ggraminis
 *              - kpastoris
 *             - lmaculans
 *             - mlaricipopulina
 *             - moryzae
 *             - mpoae
 *             - mviolaceum
 *             - ncrassa
 *             - nfischeri
 *             - pgraminis
 *             - pgraminisug99
 *             - pnodorum
 *             - pstriiformis
 *             - pteres
 *             - ptriticina
 *             - ptriticirepentis
 *             - scerevisiae
 *             - scryophilus
 *             - sjaponicus
 *             - soctosporus
 *             - spombe
 *             - sreilianum
 *             - ssclerotiorum
 *             - tmelanosporum
 *             - treesei
 *             - tvirens
 *             - umaydis
 *             - vdahliae
 *             - ylipolytica
 *             - ztritici
 *             - aaegypti
 *             - acephalotes
 *             - adarlingi
 *             - agambiae
 *             - aglabripennis
 *             - amellifera
 *             - apisum
 *             - aqueenslandica
 *             - avaga
 *             - bantarctica
 *             - bimpatiens
 *             - bmalayi
 *             - bmori
 *             - cbrenneri
 *             - cbriggsae
 *             - celegans
 *             - cgigas
 *             - cjaponica
 *             - cquinquefasciatus
 *             - cremanei
 *             - cteleta
 *             - dananassae
 *             - derecta
 *             - dgrimshawi
 *             - dmelanogaster
 *             - dmojavensis
 *             - dpersimilis
 *             - dplexippus
 *             - dponderosae
 *             - dpseudoobscura
 *             - dpulex
 *             - dsechellia
 *             - dsimulans
 *             - dvirilis
 *             - dwillistoni
 *             - dyakuba
 *             - hmelpomene
 *             - hrobusta
 *             - iscapularis
 *             - lanatina
 *             - lcuprina
 *             - lgigantea
 *             - lloa
 *             - lsalmonis
 *             - mcinxia
 *             - mdestructor
 *             - mleidyi
 *             - mscalaris
 *             - nvectensis
 *             - nvitripennis
 *             - obimaculoides
 *             - ovolvulus
 *             - phumanus
 *             - ppacificus
 *             - rprolixus
 *             - sinvicta
 *             - smansoni
 *             - smaritima
 *             - smimosarum
 *             - spurpuratus
 *             - sratti
 *             - sscabiei
 *             - tadhaerens
 *             - tcastaneum
 *             - tkitauei
 *             - tspiralis
 *             - turticae
 *             - znevadensis
 *             - alyrata
 *             - atauschii
 *             - athaliana
 *             - atrichopoda
 *             - bdistachyon
 *             - bnapus
 *             - boleracea
 *             - brapa
 *             - bvulgaris
 *             - ccrispus
 *             - cmerolae
 *             - creinhardtii
 *             - gmax
 *             - gsulphuraria
 *             - hvulgare
 *             - lperrieri
 *             - macuminata
 *             - mtruncatula
 *               - obarthii
 *              - obrachyantha
 *             - oglaberrima
 *             - oglumaepatula
 *             - oindica
 *             - olongistaminata
 *             - olucimarinus
 *             - omeridionalis
 *             - onivara
 *             - opunctata
 *             - orufipogon
 *             - osativa
 *             - ppatens
 *             - ppersica
 *             - ptrichocarpa
 *             - sbicolor
 *             - sitalica
 *             - slycopersicum
 *             - smoellendorffii
 *             - stuberosum
 *             - taestivum
 *             - tcacao
 *             - tpratense
 *             - turartu
 *             - vvinifera
 *             - zmays
 *     responses:
 *       '200':
 *         description: Success response
 *       '400':
 *         description: Invalid input (organism, target, or JSON format)
*/

// expose a rest endpoint for gconvert validator
router.post('/gene-query', (req, res) => {
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
 * @swagger
 * "/enrichment":
 *   post:
 *     tags:
 *     - Enrichment Service
 *     summary: Summarize gene list as pathway list
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
 *         type: object
 *         properties:
 *           genes:
 *             type: string
 *             description: a space-separated (spaces, tabs, newlines) list of genes
 *             required: true
 *             example: AFF4
 *           orderedQuery:
 *             type: boolean
 *             description: "genes are placed in some biologically meaningful order \n
 *               default: false"
 *             required: false
 *             example: false
 *           userThr:
 *             type: number
 *             description: "user-specified p-value threshold, results with a larger
 *               p-value are excluded \n default: 0.05"
 *             required: false
 *             example: 0.07
 *           minSetSize:
 *             type: number
 *             description: "minimum size of functional category, smaller categories
 *               are excluded \n default: 5"
 *             required: false
 *             example: 3
 *           maxSetSize:
 *             type: number
 *             description: "maximum size of functional category, larger categories are
 *               excluded \n default: 200"
 *             required: false
 *             example: 400
 *           thresholdAlgo:
 *             type: string
 *             description: "the algorithm used for determining the significance threshold
 *               \n default: fdr"
 *             required: false
 *             enum:
 *             - fdr
 *             - analytical
 *             - bonferroni
 *           custbg:
 *             type: string
 *             description: "a space-separated list of genes used as a custom statistical
 *               background \n default: "
 *             required: false
 *             example: TP53 AFF4
 *     responses:
 *       '200':
 *         description: Success response
 *       '400':
 *         description: Invalid input (orderedQuery, userThr, minSetSize, maxSetSize,
 *           thresholdAlgo, custbg or JSON format)
*/



// expose a rest endpoint for enrichment
router.post('/enrichment', (req, res) => {
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
 * "/emap":
 *   post:
 *     tags:
 *     - Emap Service
 *     summary: Generate graph information
 *     description: ''
 *     operationId: emap
 *     consumes:
 *     - application/json
 *     produces:
 *     - application/json
 *     parameters:
 *     - in: body
 *       name: body
 *       description: Pet object that needs to be added to the store
 *       required: true
 *       schema:
 *         type: object
 *         properties:
 *           pathwayInfoList:
 *             type: object
 *             description: pathway information keyed by pathway ID
 *             required: true
 *             additionalProperties: object
 *             example:
 *               GO:0043525: {}
 *               GO:0043523:
 *                 pValue: 0.05
 *           cutoff:
 *             type: number
 *             description: "cutoff point used for filtering similaritiy rates of edges
 *               pairwise \n default: 0.375"
 *             required: false
 *             example: 0.3
 *           JCWeight:
 *             type: number
 *             description: weight for Jaccard coefficient
 *             required: false
 *             example: 0.55
 *           OCWeight:
 *             type: number
 *             description: weight for overlap coefficient
 *             required: false
 *             example: 0.4
 *     responses:
 *       '200':
 *         description: Success response
 *       '400':
 *         description: invalid input (cutoff, OCweight, JCWeight or JSON format)
*/



// Expose a rest endpoint for emap
router.post('/emap', (req, res) => {
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


// Expose a rest endpoint for controller.endSession
router.get('/disconnect', function (req, res) {
  controller.endSession(req.query.uri, req.query.version, req.query.user)
    .then((package) => {
      res.json(package);
    });
});


module.exports = router;