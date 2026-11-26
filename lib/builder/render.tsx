import React from 'react';
import { Doc, Node } from './schema';
import { compileDocumentCss } from './compile-css';
import { ArrowRight, ExternalLink, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export interface RenderDocProps {
  doc: Doc;
  pageId?: string;
  mode?: 'published' | 'editor';
  activeBreakpoint?: 'mobile' | 'tablet' | 'desktop';
}

export function RenderDoc({
  doc,
  pageId,
  mode = 'published',
  activeBreakpoint = 'mobile',
}: RenderDocProps) {
  const css = React.useMemo(() => compileDocumentCss(doc), [doc]);

  const renderNode = (nodeId: string): React.ReactNode => {
    const node = doc.nodes[nodeId];
    if (!node) return null;

    const className = `n_${node.id}`;
    const props = node.props || {};

    switch (node.type) {
      case 'section':
        return (
          <section key={node.id} id={props.anchorId as string} className={className}>
            {node.children.map(renderNode)}
          </section>
        );

      case 'stack':
      case 'grid':
      case 'free':
      case 'card':
        return (
          <div key={node.id} className={className} data-node-type={node.type}>
            {node.children.map(renderNode)}
          </div>
        );

      case 'heading': {
        const level = (props.level as number) || 1;
        const text = (props.text as string) || '';
        if (level === 2) return <h2 key={node.id} className={className}>{text}</h2>;
        if (level === 3) return <h3 key={node.id} className={className}>{text}</h3>;
        return <h1 key={node.id} className={className}>{text}</h1>;
      }

      case 'text':
        return (
          <p key={node.id} className={className}>
            {(props.text as string) || ''}
          </p>
        );

      case 'badge':
        return (
          <span key={node.id} className={className}>
            {(props.text as string) || ''}
          </span>
        );

      case 'button': {
        const isDestination = props.bind === 'destination';
        const rawTargetUrl = isDestination ? doc.destination.url : (props.bind as string) || doc.destination.url;
        const clickUrl = pageId && mode === 'published' ? `/r/${pageId}/${node.id}` : rawTargetUrl;
        const label = (props.label as string) || 'Click Here';

        if (mode === 'editor') {
          return (
            <div key={node.id} className={className} role="button" aria-disabled="true">
              <span>{label}</span>
              <ArrowRight className="w-4 h-4 ml-2 inline-block opacity-80" />
            </div>
          );
        }

        return (
          <a
            key={node.id}
            href={clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            <span>{label}</span>
            <ArrowRight className="w-4 h-4 ml-2 inline-block opacity-80" />
          </a>
        );
      }

      case 'linkRow': {
        const label = (props.label as string) || '';
        const subtitle = props.subtitle as string | undefined;
        const href = (props.href as string) || '#';
        const clickUrl = pageId && mode === 'published' ? `/r/${pageId}/${node.id}` : href;

        return (
          <a
            key={node.id}
            href={mode === 'editor' ? undefined : clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            <div className="flex flex-col pr-2 truncate">
              <span className="font-semibold truncate">{label}</span>
              {subtitle && <span className="text-[12px] opacity-70 truncate">{subtitle}</span>}
            </div>
            <ExternalLink className="w-4 h-4 opacity-50 flex-shrink-0" />
          </a>
        );
      }

      case 'priceItem': {
        const name = (props.name as string) || '';
        const price = props.price as string | undefined;
        const desc = props.desc as string | undefined;

        return (
          <div key={node.id} className={className}>
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="font-bold text-[14.5px]">{name}</span>
              {price && (
                <span className="font-semibold text-[13px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 whitespace-nowrap">
                  {price}
                </span>
              )}
            </div>
            {desc && <p className="text-[12.5px] opacity-75 mt-1 leading-relaxed">{desc}</p>}
          </div>
        );
      }

      case 'image': {
        const alt = (props.alt as string) || '';
        const src = (props.urlFallback as string) || (props.mediaId ? `/api/media/${props.mediaId}` : '');
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={node.id}
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
          />
        );
      }

      case 'contact': {
        const phone = props.phone as string | undefined;
        const email = props.email as string | undefined;
        const whatsapp = props.whatsapp as string | undefined;
        const address = props.address as string | undefined;

        return (
          <div key={node.id} className={className}>
            {phone && (
              <a
                href={mode === 'editor' ? undefined : `tel:${phone}`}
                className="flex items-center gap-2 text-[13px] opacity-80 hover:opacity-100 transition-opacity"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{phone}</span>
              </a>
            )}
            {email && (
              <a
                href={mode === 'editor' ? undefined : `mailto:${email}`}
                className="flex items-center gap-2 text-[13px] opacity-80 hover:opacity-100 transition-opacity"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{email}</span>
              </a>
            )}
            {whatsapp && (
              <a
                href={
                  mode === 'editor'
                    ? undefined
                    : `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] opacity-80 hover:opacity-100 transition-opacity"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp ({whatsapp})</span>
              </a>
            )}
            {address && (
              <div className="flex items-center gap-2 text-[13px] opacity-80">
                <MapPin className="w-3.5 h-3.5" />
                <span>{address}</span>
              </div>
            )}
          </div>
        );
      }

      case 'divider':
        return <hr key={node.id} className={className} />;

      case 'spacer':
        return <div key={node.id} className={className} />;

      case 'footer':
        return (
          <footer key={node.id} className={className}>
            <span>Powered by DynamicQR</span>
          </footer>
        );

      default:
        return (
          <div key={node.id} className={className}>
            {node.children.map(renderNode)}
          </div>
        );
    }
  };

  return (
    <div
      className="builder-canvas-wrapper w-full min-h-screen flex flex-col items-center justify-start"
      style={{
        backgroundColor: doc.tokens.colors.bg,
        color: doc.tokens.colors.fg,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {renderNode(doc.root)}
    </div>
  );
}
