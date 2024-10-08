const FIX_COORD_ROTATION = -90;      

// see issue https://github.com/networked-aframe/networked-aframe/issues/267
      NAF.schemas.getComponentsOriginal = NAF.schemas.getComponents;
      NAF.schemas.getComponents = (template) => {
          if (!NAF.schemas.hasTemplate('#avatar-template')) {
              NAF.schemas.add({
                  template: '#avatar-template',
                  components: [
                      'position',
                      'rotation',
                      {
                          selector: '.head',
                          component: 'material',
                          property: 'color'
                      }
                  ]
              });
          }
          const components = NAF.schemas.getComponentsOriginal(template);
          return components;
      };

      var debug = AFRAME.utils.debug;
      var coordinates = AFRAME.utils.coordinates;

      var warn = debug('components:look-at:warn');
      var isCoordinates = coordinates.isCoordinates || coordinates.isCoordinate;

      delete AFRAME.components['look-at'];

      /**
       * Look-at component.
       *
       * Modifies rotation to either track another entity OR do a one-time turn towards a position
       * vector.
       *
       * If tracking an object via setting the component value via a selector, look-at will register
       * a behavior to the scene to update rotation on every tick.
       */
      AFRAME.registerComponent('look-at', {
          schema: {
              default: '0 0 0',

              parse: function(value) {
                  // A static position to look at.
                  if (isCoordinates(value) || typeof value === 'object') {
                      return coordinates.parse(value);
                  }
                  // A selector to a target entity.
                  return value;
              },

              stringify: function(data) {
                  if (typeof data === 'object') {
                      return coordinates.stringify(data);
                  }
                  return data;
              }
          },

          init: function() {
              this.target3D = null;
              this.vector = new THREE.Vector3();
              this.cameraListener = AFRAME.utils.bind(this.cameraListener, this);
              this.el.addEventListener('componentinitialized', this.cameraListener);
              this.el.addEventListener('componentremoved', this.cameraListener);
          },

          /**
           * If tracking an object, this will be called on every tick.
           * If looking at a position vector, this will only be called once (until further updates).
           */
          update: function() {
              var self = this;
              var target = self.data;
              var targetEl;

              // No longer looking at anything (i.e., look-at="").
              if (!target || (typeof target === 'object' && !Object.keys(target).length)) {
                  return self.remove();
              }

              // Look at a position.
              if (typeof target === 'object') {
                  return this.lookAt(new THREE.Vector3(target.x, target.y, target.z));
              }

              // Assume target is a string.
              // Query for the element, grab its object3D, then register a behavior on the scene to
              // track the target on every tick.
              targetEl = self.el.sceneEl.querySelector(target);
              if (!targetEl) {
                  warn('"' + target + '" does not point to a valid entity to look-at');
                  return;
              }
              if (!targetEl.hasLoaded) {
                  return targetEl.addEventListener('loaded', function() {
                      self.beginTracking(targetEl);
                  });
              }
              return self.beginTracking(targetEl);
          },

          tick: (function() {
              var vec3 = new THREE.Vector3();

              return function(t) {
                  // Track target object position. Depends on parent object keeping global transforms up
                  // to state with updateMatrixWorld(). In practice, this is handled by the renderer.
                  var target3D = this.target3D;
                  if (target3D) {
                      target3D.getWorldPosition(vec3);
                      this.lookAt(vec3);
                  }
              }
          })(),

          remove: function() {
              this.el.removeEventListener('componentinitialized', this.cameraListener);
              this.el.removeEventListener('componentremoved', this.cameraListener);
          },

          beginTracking: function(targetEl) {
              this.target3D = targetEl.object3D;
          },

          cameraListener: function(e) {
              if (e.detail && e.detail.name === 'camera') {
                  this.update();
              }
          },

          lookAt: function(position) {
              var vector = this.vector;
              var object3D = this.el.object3D;

              if (this.el.getObject3D('camera')) {
                  // Flip the vector to -z, looking away from target for camera entities. When using
                  // lookat from THREE camera objects, this is applied for you, but since the camera is
                  // nested into a Object3D, we need to apply this manually.
                  vector.subVectors(object3D.position, position).add(object3D.position);
              } else {
                  vector.copy(position);
              }

              object3D.lookAt(vector);
          }
      });

      AFRAME.registerPrimitive('a-hotspot', {
          defaultComponents: {
              hotspot: {}
          },
          mappings: {
              for: 'hotspot.for',
              to: 'hotspot.to'
          }
      });

      AFRAME.registerComponent('hotspot', {
          schema: {
              for: { type: 'string' },
              to: { type: 'string' },
              positioning: { type: 'boolean', default: false }
          },

          init: function() {
              this.tour = document.querySelector('a-tour');
              this.el.addEventListener('click', this.handleClick.bind(this));
          },

          handleClick: function() {
              if (this.data.positioning) return;
              var tour = this.tour.components['tour'];
              tour.loadSceneId(this.data.to);
          }
      });

      AFRAME.registerPrimitive('a-panorama', {
          defaultComponents: {
              panorama: {}
          }
      });

      AFRAME.registerComponent('panorama', {
          schema: {
              rotation: { type: 'vec3' },
              src: { type: 'string' }
          }
      });

      AFRAME.registerComponent('hotspot-helper', {
          schema: {
              target: { type: 'selector' },
              distance: { type: 'number', default: 5 },
              distanceIncrement: { type: 'number', default: 0.25 },
          },

          init: function() {
              if (!this.data.target) {
                  console.error('Hotspot-helper: You must specify a target element!');
                  return;
              }

              var self = this;

              this.camera = document.querySelector('[camera]');
              this.targetRotationOrigin = this.data.target.getAttribute('rotation');
              this.targetPositionOrigin = this.data.target.getAttribute('position');

              // Helper UI.
              var uiContainer = this.makeUi();
              document.body.appendChild(uiContainer);

              // Enabled.
              this.enabled = uiContainer.querySelector('#hh-enabled');
              this.enabled.addEventListener('click', function() {
                  uiContainer.dataset.enabled = !!self.enabled.checked;
              });

              // Set distance.
              var distanceInput = this.distanceInput = uiContainer.querySelector('#hh-distance');
              distanceInput.addEventListener('input', function() {
                  self.updateDistance(this.value);
              });
              distanceInput.value = this.data.distance;

              // Copy position to clipboard.
              var copyPosition = uiContainer.querySelector('#hh-copy-position');
              copyPosition.addEventListener('click', function() {
                  self.copyToClipboard(self.position);
              });

              // Mouse-wheel distance.
              window.addEventListener('wheel', this.handleWheel.bind(this));

              // Rotation.
              this.rotation = uiContainer.querySelector('#hh-rotation');

              // Copy rotation to clipboard.
              var copyRotation = uiContainer.querySelector('#hh-copy-rotation');
              copyRotation.addEventListener('click', function() {
                  self.copyToClipboard(self.rotation);
              });

              // Look at.
              this.lookToggle = uiContainer.querySelector('#hh-lookat');

              // Position.
              this.position = uiContainer.querySelector('#hh-position');

              // Empty object3D for position.
              var targetObject = this.targetObject = new THREE.Object3D();
              this.dolly = new THREE.Object3D();
              this.dolly.add(targetObject);
              this.el.object3D.add(this.dolly);
              this.updateDistance(this.data.distance);

              // Set positioning on target so that clicks are not triggered when placing hotspot.
              this.data.target.setAttribute('hotspot', { positioning: true });
          },

          makeUi: function() {
              var uiContainer = document.createElement('div');
              uiContainer.id = 'hh';
              var markup = `
    <style>
      #hh-heading {
        font-family: Consolas, Andale Mono, monospace;
      }

      #hh {
        background: #333;
        color: #fff;
        font-family: Helvetica, Arial, sans-serif;
        left: 0;
        margin: 10px;
        padding: 10px;
        position: absolute;
        top: 0;
      }

      #hh h1 {
        margin: 0;
      }

      #hh h2 {
        font-weight: 200;
        margin: 10px 0;
      }

      #hh[data-enabled="false"] section {
        display: none;
      }

      #hh section {
        margin: 20px 0;
      }

      #hh .hh-check,
      #hh .hh-tip {
        display: block;
        font-size: .75rem;
        margin: 8px 0;
      }

      #hh .hh-tip {
        color: rgb(148,148,148);
      }

      #hh input[type="text"] {
        border: none;
        background: rgb(108,108,108);
        color: #fff;
        padding: 5px;
      }

      #hh input[type="button"] {
        background: #fff;
        border: none;
        padding: 5px;
      }

      #hh input[type="button"]:active {
        background: rgb(47,77,135);
        color: #fff;
      }
    </style>

    <h1 id="hh-heading" class="hh-heading">hotspot-helper</h1>

    <span class="hh-check">
      <label>
        <input id="hh-enabled" type="checkbox" checked> Enabled
      </label>
    </span>

    <section>
      <label>
        <input id="hh-distance" size="5" type="text"> Hotspot distance
        <span class="hh-tip">Use mouse scroll to adjust distance</span>
      </label>
    </section>

    <section>
      <label>
        <h2>Position</h2>
        <input id="hh-position" size="20" type="text" value="1.000 1.000 1.000">
        <input id="hh-copy-position" type="button" value="Copy to Position">
      </label>
    </section>

    <section>
      <h2><label for="hh-rotation">Rotation</label></h2>
      <input id="hh-rotation" size="20" type="text" value="1.000 1.000 1.000">
      <input id="hh-copy-rotation" type="button" value="Copy to Rotation">
      <label>
        <span class="hh-check">
          <input id="hh-lookat" type="checkbox"> Look at origin
        </span>
      </label>
    </section>
    `;
              uiContainer.innerHTML = markup;
              return uiContainer;
          },

          updateDistance: function(distance) {
              this.targetObject.position.z = -distance;
          },

          copyToClipboard: function(input) {
              input.select();
              document.execCommand('copy');
              if (window.getSelection) {
                  window.getSelection().removeAllRanges();
              }
          },

          handleWheel: function(e) {
              var input = this.distanceInput;
              var data = this.data;
              var increment = e.deltaY < 0 ? data.distanceIncrement : -data.distanceIncrement;
              var value = parseFloat(input.value) + increment;
              if (value < 0) {
                  value = 0;
              }
              input.value = value;
              this.updateDistance(value);
          },

          updateRotation: function() {
              var target = this.data.target;
              if (this.lookToggle.checked) {
                  if (!target.hasAttribute('look-at')) {
                      target.setAttribute('look-at', '[camera]');
                  }
                  var worldRotation = this.data.target.object3D.getWorldRotation();
                  this.rotation.value = this.toDeg(worldRotation.x).toFixed(2) + ' ' + this.toDeg(worldRotation.y).toFixed(2) + ' ' + this.toDeg(worldRotation.z).toFixed(2);
              } else {
                  if (target.hasAttribute('look-at')) {
                      target.removeAttribute('look-at');
                  }
                  this.rotation.value = `${this.targetRotationOrigin.x} ${this.targetRotationOrigin.y} ${this.targetRotationOrigin.z}`;
                  target.setAttribute('rotation', this.targetRotationOrigin);
              }
          },

          toDeg: function(rad) {
              return rad * 180 / Math.PI;
          },

          tick: function() {
              var target = this.data.target;
              if (!target) return;
              if (this.enabled.checked) {
                  var rotation = this.camera.object3D.getWorldRotation();
                  this.dolly.rotation.copy(rotation);
                  var position = this.targetObject.getWorldPosition();
                  var cords = position.x.toFixed(2) + ' ' + position.y.toFixed(2) + ' ' + position.z.toFixed(2);
                  target.setAttribute('position', {
                      x: position.x,
                      y: position.y,
                      z: position.z
                  });
                  this.position.value = cords;
                  this.updateRotation();
              } else {
                  target.setAttribute('position', this.targetPositionOrigin);
                  target.setAttribute('rotation', this.targetRotationOrigin);
              }
          }
      });

      AFRAME.registerComponent('marker', {
          schema: {
              url: { type: 'string', default: 'www.google.com' }
          },
          init() {
              const sky = document.querySelector('a-sphere');
              var b = false
              this.el.addEventListener('click', () => {
                  //console.log(this.data.url);
                  location.href = this.data.url;
              });
          }
      });