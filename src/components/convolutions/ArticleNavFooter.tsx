import React from 'react';

interface ArticleNavFooterProps {
  children: React.ReactNode;
}

const ArticleNavFooter: React.FC<ArticleNavFooterProps> = ({ children }) => (
  <div className="row mb-5">
    <div className="col-lg-12">
      <p className="text-center small copyright-text mb-0">
        {children}
      </p>
    </div>
  </div>
);

export default ArticleNavFooter;
