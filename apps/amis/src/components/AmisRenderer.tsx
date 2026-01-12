import React from 'react';
import { render as renderAmis } from 'amis';
import { useAuth } from '../context/AuthContext';
import 'amis/lib/themes/cxd.css';
import 'amis/lib/helper.css';
import 'amis/sdk/iconfont.css';

interface AmisRendererProps {
  schema: any;
  data?: any;
  onAction?: (e: any, action: any) => void;
}

const AmisRenderer: React.FC<AmisRendererProps> = ({ schema, data = {}, onAction }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  React.useEffect(() => {
    if (containerRef.current) {
      // Enhanced data context with user info
      const contextData = {
        ...data,
        currentUser: user,
      };

      renderAmis(
        containerRef.current,
        schema,
        {
          data: contextData,
          onAction: onAction,
        }
      );
    }
  }, [schema, data, user, onAction]);

  return <div ref={containerRef} />;
};

export default AmisRenderer;
