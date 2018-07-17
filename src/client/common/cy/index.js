const cytoscape = require('cytoscape');
const Promise = require('bluebird');

const style = require('./stylesheet');
const bindEvents = require('./events');

/**
 * A service to create Cytoscape instances.  This can be used to create
 * Cytoscape instances that are passed to multiple components, with delayed
 * mounting.
 */
class CytoscapeService {
  /**
   * Creates the service, storing the specified options for later initialisation of
   * the Cytoscape instance.
   * @param options An options object that contains Cytoscape options and common app
   * binding options.
   */
  constructor(options){
    this.options = Object.assign({
      style,
      minZoom: 0.08,
      maxZoom: 4,
      zoomingEnabled: true,
      layout: {
        name: 'null'
      }
    }, options);

    this.mounted = false;

    this.mountPromise = new Promise(resolve => {
      this.resolveMount = resolve;
    });

    this.loadedPromise = new Promise(resolve => {
      this.resolveLoad = resolve;
    });
  }

  /**
   * Synchronously gets the Cytoscape instance.  This may return `undefined`, as the
   * instance might not be initialised yet.
   * @returns The Cytoscape instance (`cy`)
   */
  get(){
    return this.cy;
  }

  /**
   * Asynchronously gets the Cytoscape instance by resolving a promise with the instance
   * (`cy`).  Using this guarantees that you won't get null exceptions on `cy`.
   */
  getPromise(){
    return this.mountPromise;
  }

  loadPromise(){
    return this.loadedPromise;
  }

  /**
   * Initialise the Cytoscape instance.
   * @param container The container in which to mount.  If unspecified, Cytoscape is
   * mounted in `options.container`.
   */
  mount(container){
    if(this.mounted){
      throw new Error(`Can not mount an already mounted CytoscapeService`);
    }

    this.mounted = true;

    let options = container == null ? this.options : Object.assign({}, this.options, { container });
    let cy = this.cy = cytoscape(options);

    this.resolveMount(cy);
  }

  load(){
    if(!this.mounted){
      throw new Error(`Can not indicate loaded for an unmounted CytoscapeService`);
    }

    if(!this.cy){
      throw new Error(`Can not indicate loaded with no cy ref`);
    }

    this.resolveLoad(this.cy);
  }

  /**
   * Destroy the Cytoscape instance, unmounting it and cleaning up any listeners etc.
   */
  destroy(){
    if(this.cy == null){
      throw new Error(`Can not destroy a non-mounted CytoscapeService`);
    }

    this.cy.destroy();
  }
}

module.exports = CytoscapeService;