// import React, { useEffect, useState } from 'react';
// import CytoscapeComponent from 'react-cytoscapejs';
// import { useNavigate } from 'react-router-dom';
// import { fetchTransactions } from '../utils/solanaAPI';
// import { getNickname } from '../utils/nicknameUtils';

// export default function Home() {
//   const [elements, setElements] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     async function loadData() {
//       const transactions = await fetchTransactions('13qBA9fbEDVQcy8tZbcrGukbpXWe1pnWCu');
//       const nodes = new Set();
//       const graph = [];

//       transactions.forEach((tx, i) => {
//         const from = tx.src;
//         const to = tx.dst;
//         const time = tx.blockTime;

//         if (!nodes.has(from)) {
//           nodes.add(from);
//           graph.push({ data: { id: from, label: getNickname(from) || from, timestamp: time }});
//         }
//         if (!nodes.has(to)) {
//           nodes.add(to);
//           graph.push({ data: { id: to, label: getNickname(to) || to, timestamp: time }});
//         }

//         graph.push({ data: { source: from, target: to, label: `${time}` }});
//       });

//       setElements(graph);
//     }
//     loadData();
//   }, []);

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Solana Transaction Visualizer</h1>
//       <CytoscapeComponent
//         elements={elements}
//         style={{ width: '100%', height: '600px' }}
//         layout={{ name: 'cose' }}
//         cy={(cy) => {
//           cy.on('tap', 'node', (evt) => {
//             const address = evt.target.id();
//             navigate(`/user/${address}`);
//           });

//           cy.nodes().forEach((node) => {
//             node.qtip({
//               content: `Address: ${node.data('label')}<br/>Time: ${node.data('timestamp')}`,
//               position: { my: 'top center', at: 'bottom center' },
//               style: { classes: 'qtip-bootstrap' },
//             });
//           });
//         }}
//       />
//     </div>
//   );
// }







import React, { useEffect, useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useNavigate } from 'react-router-dom';
import { fetchLiveTransactions } from '../utils/solanaAPI';
import { getNickname } from '../utils/nicknameUtils';
import cytoscape from 'cytoscape';
import popper from 'cytoscape-popper';

// Register popper extension for tooltips
if (!cytoscape.prototype.popperRef) {
  cytoscape.use(popper);
}

export default function Home() {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(10); // seconds
  const [tooltips, setTooltips] = useState([]);
  const [maxNodes, setMaxNodes] = useState(50);
  const cyRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // Helper function to shorten address for display
  const shortenAddress = (address) => {
    if (!address || address === 'unknown') return 'Unknown';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Handle form submission to set update interval
  const handleUpdateIntervalChange = (e) => {
    setUpdateInterval(Number(e.target.value));
  };

  // Handle max nodes change
  const handleMaxNodesChange = (e) => {
    setMaxNodes(Number(e.target.value));
  };

  // Toggle live updates
  const toggleLiveUpdates = () => {
    setIsLive(!isLive);
  };

  // Clear all nodes and restart
  const handleClearGraph = () => {
    setElements([]);
    setTransactionCount(0);
  };

  const addNewTransactions = async () => {
    try {
      setError(null);
      
      // Clean up any existing tooltips
      tooltips.forEach(tooltip => tooltip.destroy());
      setTooltips([]);
      
      // Fetch new transactions
      const transactions = await fetchLiveTransactions(10);
      
      if (!transactions || transactions.length === 0) {
        console.log('No new transactions found');
        return;
      }
      
      setElements(prevElements => {
        // Create a map of existing nodes and edges for fast lookup
        const nodeMap = new Map();
        const edgeMap = new Map();
        
        prevElements.forEach(ele => {
          if (ele.data.id) {
            if (ele.data.source && ele.data.target) {
              // This is an edge
              edgeMap.set(ele.data.id, ele);
            } else {
              // This is a node
              nodeMap.set(ele.data.id, ele);
            }
          }
        });
        
        const newElements = [...prevElements];
        
        transactions.forEach((tx) => {
          const from = tx.src;
          const to = tx.dst;
          
          if (from === 'unknown' && to === 'unknown') {
            // Skip transactions with unknown sources and destinations
            return;
          }
          
          // Add source node if it doesn't exist
          if (from !== 'unknown' && !nodeMap.has(from)) {
            const sourceNode = { 
              data: { 
                id: from, 
                label: getNickname(from) || shortenAddress(from),
                fullAddress: from,
                timestamp: tx.blockTime 
              },
              classes: 'source-node'
            };
            newElements.push(sourceNode);
            nodeMap.set(from, sourceNode);
          }
          
          // Add target node if it doesn't exist
          if (to !== 'unknown' && !nodeMap.has(to)) {
            const targetNode = { 
              data: { 
                id: to, 
                label: getNickname(to) || shortenAddress(to),
                fullAddress: to,
                timestamp: tx.blockTime 
              },
              classes: 'target-node'
            };
            newElements.push(targetNode);
            nodeMap.set(to, targetNode);
          }
          
          // Add edge (transaction)
          const edgeId = `${tx.signature}`;
          if (!edgeMap.has(edgeId)) {
            const edge = { 
              data: { 
                id: edgeId,
                source: from !== 'unknown' ? from : to, // Fallback if source is unknown
                target: to !== 'unknown' ? to : from, // Fallback if target is unknown
                amount: tx.lamport ? (tx.lamport / 1000000000).toFixed(9) : '0', // Convert lamports to SOL
                timestamp: tx.blockTime,
                signature: tx.signature
              },
              classes: 'transaction-edge'
            };
            newElements.push(edge);
            edgeMap.set(edgeId, edge);
          }
        });
        
        // Limit the number of nodes to maintain performance
        if (newElements.length > maxNodes * 3) { // Rough estimate considering both nodes and edges
          return newElements.slice(-maxNodes * 3);
        }
        
        return newElements;
      });
      
      setTransactionCount(prevCount => prevCount + transactions.length);
      
    } catch (err) {
      console.error('Error loading transaction data:', err);
      setError(`Failed to load transaction data: ${err.message}`);
    }
  };

  useEffect(() => {
    // Initial data load
    addNewTransactions().then(() => setLoading(false));
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      tooltips.forEach(tooltip => tooltip.destroy());
    };
  }, []);

  // Set up timer for live updates
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isLive) {
      timerRef.current = setInterval(() => {
        addNewTransactions();
      }, updateInterval * 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLive, updateInterval, maxNodes]);

  // Cytoscape graph styling and configuration
  const cytoscapeStylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': '#4CAF50',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'width': 60,
        'height': 60,
        'font-size': 12,
        'color': '#fff'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#2196F3',
        'curve-style': 'bezier',
        'target-arrow-color': '#2196F3',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.5
      }
    },
    {
      selector: '.source-node',
      style: {
        'background-color': '#E91E63',
      }
    },
    {
      selector: '.target-node',
      style: {
        'background-color': '#9C27B0',
      }
    },
    {
      selector: '.highlighted',
      style: {
        'border-width': 3,
        'border-color': '#FFEB3B',
        'border-opacity': 1
      }
    },
    {
      selector: '.new-transaction',
      style: {
        'line-color': '#FF9800',
        'target-arrow-color': '#FF9800',
        'width': 5,
        'transition-property': 'line-color, target-arrow-color, width',
        'transition-duration': '2s'
      }
    }
  ];

  // Create tooltips for nodes and edges
  const createTooltip = (ele) => {
    const ref = ele.popperRef();
    const domElement = document.createElement('div');
    
    domElement.classList.add('cytoscape-tooltip');
    document.body.appendChild(domElement);
    
    let content = '';
    
    if (ele.isNode()) {
      // Node tooltip
      const address = ele.data('fullAddress') || ele.id();
      content = `
        <div style="background-color: #333; color: white; padding: 10px; border-radius: 5px; max-width: 300px;">
          <strong>Address:</strong> ${address}<br>
          <button onclick="window.open('https://solscan.io/account/${address}', '_blank')" 
                  style="background: #2196F3; color: white; border: none; padding: 5px 10px; margin-top: 5px; border-radius: 3px; cursor: pointer;">
            View on Solscan
          </button>
        </div>
      `;
    } else if (ele.isEdge()) {
      // Edge tooltip
      const source = shortenAddress(ele.data('source'));
      const target = shortenAddress(ele.data('target'));
      const amount = ele.data('amount') || '0';
      const timestamp = ele.data('timestamp') || 'Unknown';
      const signature = ele.data('signature');
      
      content = `
        <div style="background-color: #333; color: white; padding: 10px; border-radius: 5px; max-width: 300px;">
          <strong>From:</strong> ${source}<br>
          <strong>To:</strong> ${target}<br>
          <strong>Amount:</strong> ${amount} SOL<br>
          <strong>Time:</strong> ${timestamp}<br>
          <button onclick="window.open('https://solscan.io/tx/${signature}', '_blank')" 
                  style="background: #2196F3; color: white; border: none; padding: 5px 10px; margin-top: 5px; border-radius: 3px; cursor: pointer;">
            View on Solscan
          </button>
        </div>
      `;
    }
    
    domElement.innerHTML = content;
    
    const popper = ref.popper({
      content: domElement,
      placement: 'top',
    });
    
    return {
      update: () => {
        popper.update();
      },
      destroy: () => {
        if (popper) {
          popper.destroy();
        }
        if (domElement) {
          domElement.remove();
        }
      }
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading transaction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Solana Live Transaction Visualizer</h1>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="bg-white rounded shadow p-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Live Transactions</h2>
              <p className="text-gray-600">Total transactions: {transactionCount}</p>
            </div>
            <button 
              onClick={toggleLiveUpdates}
              className={`px-4 py-2 rounded font-semibold ${isLive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
            >
              {isLive ? 'Pause' : 'Resume'} Live Updates
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded shadow p-4 flex-1">
          <h2 className="text-lg font-semibold mb-2">Settings</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <label className="w-40">Update every:</label>
              <select 
                value={updateInterval} 
                onChange={handleUpdateIntervalChange}
                className="border rounded p-1"
              >
                <option value="2">2 seconds</option>
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="w-40">Max nodes:</label>
              <select 
                value={maxNodes} 
                onChange={handleMaxNodesChange}
                className="border rounded p-1"
              >
                <option value="20">20 nodes</option>
                <option value="50">50 nodes</option>
                <option value="100">100 nodes</option>
                <option value="200">200 nodes</option>
              </select>
            </div>
            <button 
              onClick={handleClearGraph} 
              className="mt-2 bg-gray-500 text-white px-4 py-1 rounded"
            >
              Clear Graph
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {elements.length > 0 ? (
        <div className="border rounded overflow-hidden">
          <CytoscapeComponent
            elements={elements}
            style={{ width: '100%', height: '70vh' }}
            stylesheet={cytoscapeStylesheet}
            layout={{ 
              name: 'cose',
              idealEdgeLength: 100,
              nodeOverlap: 20,
              refresh: 20,
              fit: true,
              padding: 30,
              randomize: false,
              componentSpacing: 100,
              nodeRepulsion: 400000,
              edgeElasticity: 100,
              nestingFactor: 5,
              gravity: 80,
              numIter: 1000,
              initialTemp: 200,
              coolingFactor: 0.95,
              minTemp: 1.0
            }}
            cy={(cy) => {
              cyRef.current = cy;
              
              // Node click event to navigate to user page
              cy.on('tap', 'node', (evt) => {
                const node = evt.target;
                const address = node.data('fullAddress') || node.id();
                
                // Navigate to Solscan in a new tab
                window.open(`https://solscan.io/account/${address}`, '_blank');
              });
              
              // Edge click event to view transaction details
              cy.on('tap', 'edge', (evt) => {
                const edge = evt.target;
                const signature = edge.data('signature');
                
                // Navigate to Solscan transaction page in a new tab
                window.open(`https://solscan.io/tx/${signature}`, '_blank');
              });
              
              // Mouse over events for hover effects
              cy.on('mouseover', 'node, edge', (event) => {
                const ele = event.target;
                ele.addClass('highlighted');
                
                // Create and show tooltip
                const tooltip = createTooltip(ele);
                setTooltips(tooltips => [...tooltips, tooltip]);
              });
              
              cy.on('mouseout', 'node, edge', (event) => {
                const ele = event.target;
                ele.removeClass('highlighted');
                
                // Remove tooltips
                tooltips.forEach(tooltip => tooltip.destroy());
                setTooltips([]);
              });
            }}
          />
        </div>
      ) : (
        <div className="text-center p-10 border rounded bg-gray-50">
          No transactions to display yet. Wait for new transactions to appear.
        </div>
      )}
    </div>
  );
}