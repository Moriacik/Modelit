import React from 'react';
import './PaymentConfirmModal.css';

const PaymentConfirmModal = ({
  stage,
  amount,
  orderToken,
  orderId,
  onConfirm,
  onCancel,
  isLoading
}) => {
  const getStageInfo = (stage) => {
    const info = {
      deposit: {
        title: 'Potvrdenie Platby - Zaloha',
        emoji: '💰',
        percentage: '30%',
        description: 'Po platbe sa začína vývoj',
        benefits: [
          'Po platbe sa začína vývoj',
          'Dostanete aktualizácie 1x za deň',
          'Drafty uvidíte za ~2 týždne'
        ],
        buttonText: 'Áno, zaplatiť zalohu'
      },
      midway: {
        title: 'Potvrdenie Platby - Priebežná Platba',
        emoji: '🎬',
        percentage: '40%',
        description: 'Po schválení draftu',
        benefits: [
          'Draft bol schválený',
          'Pokračujeme s finálnymi úpravami',
          'Hotová práca za ~2 týždne'
        ],
        buttonText: 'Áno, zaplatiť'
      },
      final: {
        title: 'Potvrdenie Platby - Finálna Platba',
        emoji: '🎉',
        percentage: '30%',
        description: 'Po dokončení projektu',
        benefits: [
          'Projekt je hotový',
          'Dostanete transfer prístupu',
          'Lifetime support'
        ],
        buttonText: 'Áno, zaplatiť finálnu platbu'
      }
    };
    return info[stage];
  };

  const info = getStageInfo(stage);

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-modal">
        <button className="modal-close" onClick={onCancel} disabled={isLoading}>
          ×
        </button>

        <h2>
          <span className="modal-emoji">{info.emoji}</span>
          {info.title}
        </h2>

        <div className="payment-details">
          <p className="details-intro">Chystáte sa zaplatiť:</p>

          <div className="amount-box">
            <div className="amount-value">{amount}€</div>
            <div className="amount-desc">({info.percentage} z celkovej ceny)</div>
          </div>

          <div className="benefits-list">
            {info.benefits.map((benefit, idx) => (
              <div key={idx} className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span className="benefit-text">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="bank-details">
            <div className="detail-row">
              <span className="detail-label">Číslo účtu:</span>
              <span className="detail-value">SK76 1200 0000 1987 4263 7541</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ref. číslo:</span>
              <span className="detail-value">{orderToken || 'ORD-2025-XXXXX'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Variabilný symbol:</span>
              <span className="detail-value">{orderId || '123456789'}</span>
            </div>
          </div>

          <p className="warning-text">
            ⚠️ Simulovaná platba - v reálnom projekte by bol PayPal alebo Stripe
          </p>
        </div>

        <div className="modal-actions">
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Spracovávam...' : `${info.buttonText} (${amount}€)`}
          </button>
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Zrušiť
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmModal;
