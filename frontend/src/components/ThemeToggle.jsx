import React from 'react';
import styled from 'styled-components';

const Switch = ({ on, onToggle }) => {
    return (
        <StyledWrapper>
            <label htmlFor="theme" className="theme" onClick={onToggle}>
                <span className="theme__toggle-wrap">
                    <input
                        id="theme"
                        className="theme__toggle"
                        type="checkbox"
                        role="switch"
                        name="theme"
                        checked={on}
                        onChange={() => { }} // Controlled via onClick on label
                    />
                    <span className="theme__fill" />
                    <span className="theme__icon">
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                    </span>
                </span>
            </label>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  /* Default */
  .theme {
    display: flex;
    align-items: center;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }

  .theme__fill,
  .theme__icon {
    transition: 0.3s;
  }

  .theme__fill {
    background-color: #111;
    display: block;
    position: fixed;
    inset: 0;
    height: 100vh;
    width: 100vw;
    z-index: -9999;
    transform: translateX(-100%);
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .theme__icon,
  .theme__toggle {
    z-index: 1;
  }

  .theme__icon,
  .theme__icon-part {
    position: absolute;
    pointer-events: none;
  }

  .theme__icon {
    display: block;
    top: 50%;
    transform: translateY(-50%);
    left: 4px;
    width: 1.5em;
    height: 1.5em;
  }

  .theme__icon-part {
    border-radius: 50%;
    box-shadow: 0.4em -0.4em 0 0.5em hsl(0,0%,100%) inset;
    top: calc(50% - 0.5em);
    left: calc(50% - 0.5em);
    width: 1em;
    height: 1em;
    transition: box-shadow 0.3s ease-in-out,
  		opacity 0.3s ease-in-out,
  		transform 0.3s ease-in-out;
    transform: scale(0.5);
  }

  .theme__icon-part ~ .theme__icon-part {
    background-color: hsl(0,0%,100%);
    border-radius: 0.05em;
    top: 50%;
    left: calc(50% - 0.05em);
    transform: rotate(0deg) translateY(0.5em);
    transform-origin: 50% 0;
    width: 0.1em;
    height: 0.2em;
  }

  .theme__icon-part:nth-child(3) {
    transform: rotate(45deg) translateY(0.45em);
  }

  .theme__icon-part:nth-child(4) {
    transform: rotate(90deg) translateY(0.45em);
  }

  .theme__icon-part:nth-child(5) {
    transform: rotate(135deg) translateY(0.45em);
  }

  .theme__icon-part:nth-child(6) {
    transform: rotate(180deg) translateY(0.45em);
  }

  .theme__icon-part:nth-child(7) {
    transform: rotate(225deg) translateY(0.45em);
  }

  .theme__icon-part:nth-child(8) {
    transform: rotate(270deg) translateY(0.5em);
  }

  .theme__icon-part:nth-child(9) {
    transform: rotate(315deg) translateY(0.5em);
  }

  .theme__label,
  .theme__toggle,
  .theme__toggle-wrap {
    position: relative;
    margin: 0;
  }

  .theme__toggle,
  .theme__toggle:before {
    display: block;
  }

  .theme__toggle {
    background-color: hsl(48,90%,85%);
    border-radius: 25px;
    padding: 0;
    width: 48px;
    height: 26px;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    transition: background-color 0.3s ease-in-out,
  		box-shadow 0.15s ease-in-out,
  		transform 0.3s ease-in-out;
  }

  .theme__toggle:before {
    background-color: hsl(48,90%,55%);
    border-radius: 50%;
    content: "";
    width: 20px;
    height: 20px;
    position: absolute;
    top: 3px;
    left: 3px;
    transition: 0.3s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  .theme__toggle:focus {
    outline: transparent;
  }

  /* Checked */
  .theme__toggle:checked {
    background-color: hsl(198,90%,15%);
  }

  .theme__toggle:checked:before,
  .theme__toggle:checked ~ .theme__icon {
    transform: translate(22px, -50%);
  }

  .theme__toggle:checked:before {
    background-color: hsl(198,90%,55%);
    transform: translate(22px, 0);
  }

  .theme__toggle:checked ~ .theme__fill {
    transform: translateX(0);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(1) {
    box-shadow: 0.2em -0.2em 0 0.2em hsl(0,0%,100%) inset;
    transform: scale(1);
    top: 0.2em;
    left: -0.2em;
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part ~ .theme__icon-part {
    opacity: 0;
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(2) {
    transform: rotate(45deg) translateY(0.8em);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(3) {
    transform: rotate(90deg) translateY(0.8em);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(4) {
    transform: rotate(135deg) translateY(0.8em);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(5) {
    transform: rotate(180deg) translateY(0.8em);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(6) {
    transform: rotate(225deg) translateY(0.8em);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(7) {
    transform: rotate(270deg) translateY(0.8em);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(8) {
    transform: rotate(315deg) translateY(0.8em);
  }

  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(9) {
    transform: rotate(360deg) translateY(0.8em);
  }

  .theme__toggle-wrap {
    margin: 0;
    display: flex;
    align-items: center;
  }
`;

export default Switch;
