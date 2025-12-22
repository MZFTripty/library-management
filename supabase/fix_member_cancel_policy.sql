-- Fix Member Cancel Request RLS Policy

-- Enable members to delete their own pending borrow records
CREATE POLICY "Members can cancel their own pending requests"
    ON public.borrow_records FOR DELETE
    USING (
        member_id = auth.uid() 
        AND status = 'pending'
    );
