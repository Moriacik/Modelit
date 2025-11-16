import React, { useState } from 'react';
import './PaymentPlanSection.css';
import PaymentConfirmModal from './PaymentConfirmModal';

const PaymentPlanSection = ({ order, onOrderUpdate }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Určenie aktuálnej fázy platby
  const getCurrentStage = () => {
    if (order.deposit_paid_at) {
      if (order.midway_paid_at) {
        if (order.final_paid_at) return 'completed';
        return 'final';
      }
      return 'midway';
    }
    return 'deposit';
  };

  // Výpočet percenta progressu
  const getProgressPercentage = () => {
    const currentStage = getCurrentStage();
    if (currentStage === 'deposit') return 0;
    if (currentStage === 'midway') return 33.33;
    if (currentStage === 'final') return 66.66;
    return 100;
  };

  // Výpočet zaplatených peňazí
  const calculatePaidAmount = () => {
    let total = 0;
    if (order.deposit_paid_at) total += parseFloat(getDepositAmount()) || 0;
    if (order.midway_paid_at) total += parseFloat(getMidwayAmount()) || 0;
    if (order.final_paid_at) total += parseFloat(getFinalAmount()) || 0;
    return total.toFixed(2);
  };

  // Výpočet percenta zaplatené
  const calculatePaidPercentage = () => {
    if (!order.agreed_price) return 0;
    const paid = parseFloat(calculatePaidAmount());
    const total = parseFloat(order.agreed_price) || 0;
    return Math.round((paid / total) * 100);
  };

  // Výpočet zostávajúcej sumy
  const calculateRemaining = () => {
    const paid = parseFloat(calculatePaidAmount());
    const total = parseFloat(order.agreed_price) || 0;
    const remaining = total - paid;
    return Math.max(0, remaining).toFixed(2);
  };

  // Handler pre otvorenie modálu
  const handlePaymentClick = (stage) => {
    setSelectedStage(stage);
    setShowPaymentModal(true);
  };

  // Helper funkcie na výpočet milestone cien (ak nie sú v databáze)
  const getDepositAmount = () => {
    if (order.deposit_required) return parseFloat(order.deposit_required);
    if (order.agreed_price) return (parseFloat(order.agreed_price) * 0.3).toFixed(2);
    return 0;
  };

  const getMidwayAmount = () => {
    if (order.midway_required) return parseFloat(order.midway_required);
    if (order.agreed_price) return (parseFloat(order.agreed_price) * 0.3).toFixed(2);
    return 0;
  };

  const getFinalAmount = () => {
    if (order.final_required) return parseFloat(order.final_required);
    if (order.agreed_price) return (parseFloat(order.agreed_price) * 0.4).toFixed(2);
    return 0;
  };

  // Handler pre potvrdenie platby
  const handleConfirmPayment = async (stage) => {
    setIsProcessing(true);
    try {
      const endpoint = `/app/src/php/process-payment-${stage}.php`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          order_token: order.order_token,
          stage: stage
        })
      });

      const result = await response.json();

      if (result.success) {
        // Úspešná platba - aktualizovať order v parente
        if (onOrderUpdate) {
          const updatedOrder = {
            ...order,
            deposit_paid_at: result.payment_data.deposit_paid_at,
            midway_paid_at: result.payment_data.midway_paid_at,
            final_paid_at: result.payment_data.final_paid_at
          };
          onOrderUpdate(updatedOrder);
        }
        
        alert(`${stage} platba bola úspešne vykonaná!`);
        setShowPaymentModal(false);
      } else {
        alert(`Chyba: ${result.message}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Chyba pri spracovaní platby');
    } finally {
      setIsProcessing(false);
    }
  };

  // Nezobraziť payment plan ak nie je agreed price
  if (!order.agreed_price) {
    return null;
  }

  const currentStage = getCurrentStage();
  const progressPercentage = getProgressPercentage();

  return (
    <>
      <section className="payment-plan-v2">
        {/* Timeline Header */}
        <div className="timeline-header">
          <h2>Platobný plán</h2>
          <div className="timeline-summary">
            <div className="summary-stat">
              <span className="stat-label">Celkem:</span>
              <span className="stat-value">{order.agreed_price}€</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Zaplatené:</span>
              <span className="stat-value paid">{calculatePaidAmount()}€</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Postup:</span>
              <span className="stat-value">{calculatePaidPercentage()}%</span>
            </div>
          </div>
        </div>

        {/* Payment Plan - New Grid Layout */}
        <div className="payment-plan-grid" style={{ '--progress-width': `${progressPercentage}%` }}>
          {/* Checkpoint 1: Deposit */}
          <div className={`payment-stage ${order.deposit_paid_at ? 'completed' : currentStage === 'deposit' ? 'active' : ''}`}>
            {/* Row 1: Label */}
            <div className="stage-label">Zaloha</div>
            
            {/* Row 2: Timeline with dot */}
            <div className="stage-timeline">
              <div className={`stage-dot ${order.deposit_paid_at ? 'completed' : currentStage === 'deposit' ? 'active' : ''}`}></div>
            </div>
            
            {/* Row 3: Amount */}
            <div className="stage-amount">{getDepositAmount()}€</div>
            
            {/* Row 4: Button */}
            {order.deposit_paid_at && (
              <button className="stage-btn deposit paid" disabled>
                ✓ Zaplatené
              </button>
            )}
            {!order.deposit_paid_at && currentStage === 'deposit' && (
              <button 
                className="stage-btn deposit"
                onClick={() => handlePaymentClick('deposit')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Spracovávam...' : 'Zaplatiť'}
              </button>
            )}
            {!order.deposit_paid_at && currentStage !== 'deposit' && (
              <div className="stage-btn-placeholder"></div>
            )}
          </div>

          {/* Checkpoint 2: Midway */}
          <div className={`payment-stage ${order.midway_paid_at ? 'completed' : currentStage === 'midway' ? 'active' : ''}`}>
            {/* Row 1: Label */}
            <div className="stage-label">Midway</div>
            
            {/* Row 2: Timeline with dot */}
            <div className="stage-timeline">
              <div className={`stage-dot ${order.midway_paid_at ? 'completed' : currentStage === 'midway' ? 'active' : ''}`}></div>
            </div>
            
            {/* Row 3: Amount */}
            <div className="stage-amount">{getMidwayAmount()}€</div>
            
            {/* Row 4: Button */}
            {order.midway_paid_at && (
              <button className="stage-btn midway paid" disabled>
                ✓ Zaplatené
              </button>
            )}
            {!order.midway_paid_at && currentStage === 'midway' && (
              <button 
                className="stage-btn midway"
                onClick={() => handlePaymentClick('midway')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Spracovávam...' : 'Zaplatiť'}
              </button>
            )}
            {!order.midway_paid_at && currentStage !== 'midway' && (
              <div className="stage-btn-placeholder"></div>
            )}
          </div>

          {/* Checkpoint 3: Final */}
          <div className={`payment-stage ${order.final_paid_at ? 'completed' : currentStage === 'final' ? 'active' : ''}`}>
            {/* Row 1: Label */}
            <div className="stage-label">Finálna</div>
            
            {/* Row 2: Timeline with dot */}
            <div className="stage-timeline">
              <div className={`stage-dot ${order.final_paid_at ? 'completed' : currentStage === 'final' ? 'active' : ''}`}></div>
            </div>
            
            {/* Row 3: Amount */}
            <div className="stage-amount">{getFinalAmount()}€</div>
            
            {/* Row 4: Button */}
            {order.final_paid_at && (
              <button className="stage-btn final paid" disabled>
                ✓ Zaplatené
              </button>
            )}
            {!order.final_paid_at && currentStage === 'final' && (
              <>
                {!order.final_files || order.final_files.length === 0 ? (
                  <button 
                    className="stage-btn final disabled"
                    disabled
                    title="Admin ešte nenahrali finálne súbory"
                  >
                    Počkajte na finálne súbory
                  </button>
                ) : (
                  <button 
                    className="stage-btn final"
                    onClick={() => handlePaymentClick('final')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Spracovávam...' : 'Zaplatiť'}
                  </button>
                )}
              </>
            )}
            {!order.final_paid_at && currentStage !== 'final' && (
              <div className="stage-btn-placeholder"></div>
            )}
          </div>
        </div>

        {/* Completion Message */}
        {currentStage === 'completed' && (
          <div className="payment-completed">
            <div className="completed-icon">✓</div>
            <h3>Všetky platby boli vykonané!</h3>
            <p>Projekt je plne zaplatený. Finálne súbory sú dostupné na stiahnutie.</p>
          </div>
        )}
      </section>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentConfirmModal
          stage={selectedStage}
          amount={
            selectedStage === 'deposit'
              ? getDepositAmount()
              : selectedStage === 'midway'
              ? getMidwayAmount()
              : getFinalAmount()
          }
          orderToken={order.order_token}
          orderId={order.id}
          onConfirm={() => handleConfirmPayment(selectedStage)}
          onCancel={() => setShowPaymentModal(false)}
          isLoading={isProcessing}
        />
      )}
    </>
  );
};

export default PaymentPlanSection;
