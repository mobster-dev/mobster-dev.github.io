document.querySelector('.center-container').addEventListener('mouseenter', () => {
    // Cria o elemento da onda de choque
    const shockwave = document.createElement('div');
    shockwave.classList.add('shockwave');
  
    // Adiciona a onda de choque ao DOM
    document.body.appendChild(shockwave);
  
    // Remove a onda de choque após a animação
    shockwave.addEventListener('animationend', () => {
      shockwave.remove();
    });
  });
  