'use strict';

var NodeManager = require('./nodemanager');
var RiakNode = require('./riaknode');
var inherits = require('util').inherits;
var logger = require('winston');

/**
 * @module Core
 */

/**
 * The default NodeManager used by RiakCluster.
 * 
 * This NodeManager does a round-robin selection of RiakNodes.
 * 
 * @class DefaultNodeManager
 * @constructor
 * @extends NodeManager 
 */
function DefaultNodeManager()  {
    NodeManager.call(this);
    this._nodeIndex = 0;
}

inherits(DefaultNodeManager, NodeManager);

DefaultNodeManager.prototype.executeOnNode = function(nodes, command, previous) {

    var executing = false;
    var startingIndex = this._nodeIndex;
    do {
        // Check index before accessing {nodes} because elements can be removed from {nodes}.
        if (this._nodeIndex >= nodes.length) {
            this._nodeIndex = 0;
        }
        var node = nodes[this._nodeIndex];
        this._nodeIndex++;

        // don't try the same node twice in a row if we have multiple nodes
        if (nodes.length > 1 && previous && previous === node) {
            continue;
        }
        
		logger.debug("[DefaultNodeManager] node (%s:%d) state %d", node.remoteAddress, node.remotePort, node.state);
        if (node.state === RiakNode.State.RUNNING) {
			logger.debug("[DefaultNodeManager] executing command '%s' on node (%s:%d)", command.PbRequestName, node.remoteAddress, node.remotePort);
            if (node.execute(command)) {
                executing = true;
                break;
            } else {
				logger.debug("[DefaultNodeManager] command '%s' did NOT execute", command.PbRequestName);
			}
        }
    } while (this._nodeIndex !== startingIndex);
    
    return executing;
    
};

module.exports = DefaultNodeManager;
